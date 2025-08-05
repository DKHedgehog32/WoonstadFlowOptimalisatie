/**
 * =============================================
 * Woonstad Flow Case Call Log Email Service
 * =============================================
 * Date: 2025-07-31
 * Last Changed: 2025-08-05
 * Description:
 * Invocable Apex service for Salesforce Flow.
 * - Creates a Case and related Request__c record.
 * - Handles supplier information:
 *      Supplier_Name_Plate__c stores the API name
 *      Supplier display name & email used for sending.
 * - Always includes static Weijntjes Hang- En Sluitwerk.
 * - Sends two emails:
 *      (1) To the Supplier using supplierTemplateId
 *      (2) To the Renter using renterTemplateId
 * - Ensures both emails are logged to the Case activity history.
 * - Uses TreatTargetObjectAsRecipient(false) to prevent the log user from receiving supplier emails.
 * - Logs email confirmations as ContentVersion linked to the Case.
 * - Updates the Case status to 'Closed' after successful processing.
 * - Copies Label__c from Account to Case.
 */
public with sharing class woonstadFlowCaseCallLogEmailService {
    
    // ========== Flow Input ==========
    public class Request {
        @InvocableVariable(required=true) public Id accountId;
        @InvocableVariable(required=true) public Id contactId; // AccountId if Person Account
        @InvocableVariable(required=true) public Id supplierTemplateId;
        @InvocableVariable(required=true) public Id renterTemplateId;
        @InvocableVariable(required=true) public String caseOrigin;
        @InvocableVariable(required=true) public String nameplateText;
        @InvocableVariable(required=false) public String flowStartTime;
        
        // Supplier override fields
        @InvocableVariable(required=false) public String supplierNameInput;
        @InvocableVariable(required=false) public String supplierEmailInput;
    }

    // ========== Flow Output ==========
    public class Response {
        @InvocableVariable public Id caseId;
        @InvocableVariable public Id requestId;
        @InvocableVariable public String status;

        // Dynamic Supplier outputs
        @InvocableVariable public String supplierApiName;
        @InvocableVariable public String supplierName;
        @InvocableVariable public String supplierEmail;

        // Static Weijntjes outputs
        @InvocableVariable public String weijntjesApiName;
        @InvocableVariable public String weijntjesName;
        @InvocableVariable public String weijntjesEmail;
    }

    // ========== Main Execution ==========
    @InvocableMethod(label='Create Case, Request, and Send Email')
    public static List<Response> execute(List<Request> requests) {
        List<Response> results = new List<Response>();

        for (Request req : requests) {
            Response res = new Response();
            try {
                // Track Flow execution time
                Datetime startTime;
                Integer processMinutes = 0;
                if (String.isNotBlank(req.flowStartTime)) {
                    try {
                        startTime = Datetime.valueOf(req.flowStartTime);
                        Long diffMillis = Datetime.now().getTime() - startTime.getTime();
                        processMinutes = Integer.valueOf(Math.floor((Decimal)diffMillis / (1000 * 60)));
                    } catch (Exception e) {
                        System.debug('Could not parse flowStartTime: ' + req.flowStartTime + ' | ' + e.getMessage());
                    }
                }

                // Fetch Account data (added Label__c)
                Account acc = [
                    SELECT Id, Name, PersonEmail,
                           Full_Shipping_Street__c,
                           Full_Shipping_Postal_Code__c,
                           Full_Shipping_City__c,
                           Full_Shipping_Country__c,
                           IsPersonAccount, PersonContactId,
                           Label__c
                    FROM Account
                    WHERE Id = :req.accountId
                    LIMIT 1
                ];

                // Build Case subject/description
                String subjectText = 'Aanvraag naamplaatje voor ' + acc.Full_Shipping_Street__c;
                String descriptionText = 'Aanvraag naamplaatje voor:' + '\n'
                    + (acc.Full_Shipping_Street__c != null ? acc.Full_Shipping_Street__c : '') + '\n'
                    + (acc.Full_Shipping_Postal_Code__c != null ? acc.Full_Shipping_Postal_Code__c : '') + '\n'
                    + (acc.Full_Shipping_City__c != null ? acc.Full_Shipping_City__c : '') + '\n'
                    + (acc.Full_Shipping_Country__c != null ? acc.Full_Shipping_Country__c : '') + '\n'
                    + 'Aangevraagd door ' + acc.Name;

                Id runningUserId = UserInfo.getUserId();

                // 1. Create Case (populate Label__c)
                Case c = new Case(
                    Subject = subjectText,
                    Description = descriptionText,
                    OwnerId = runningUserId,
                    AccountId = req.accountId,
                    Origin = req.caseOrigin,
                    Nameplate_Text__c = req.nameplateText,
                    Label__c = acc.Label__c,
                    Status = 'New'
                );
                insert c;

                // 2. Get Supplier info from RealEstateSupplierFlowController
                RealEstateSupplierFlowController.SupplierWrapper supplier =
                    RealEstateSupplierFlowController.getFirstSupplier(req.accountId);

                // Prefer Flow input if provided, fallback to Apex logic
                String supplierApiName = (supplier != null ? supplier.supplierApiName : null);
                String supplierName    = !String.isBlank(req.supplierNameInput) 
                                          ? req.supplierNameInput 
                                          : (supplier != null ? supplier.supplierName : null);
                String supplierEmail   = !String.isBlank(req.supplierEmailInput) 
                                          ? req.supplierEmailInput 
                                          : (supplier != null ? supplier.supplierEmail : null);

                // Static Weijntjes (always returned)
                String weijntjesApiName = (supplier != null ? supplier.weijntjesApiName : 'Weijntjes Hang- En Sluitwerk');
                String weijntjesName    = (supplier != null ? supplier.weijntjesName : 'Weijntjes Hang- En Sluitwerk');
                String weijntjesEmail   = (supplier != null ? supplier.weijntjesEmail : 'dennis.kristoffers@cobracrm.nl');

                // 3. Create Request__c record
                Request__c r = new Request__c(
                    Account__c = req.accountId,
                    Case__c = c.Id,
                    Contact_Email__c = acc.PersonEmail,
                    External_Status__c = 'Completed',
                    Name_Plate_Text__c = req.nameplateText,
                    OwnerId = runningUserId,
                    Process_Time__c = processMinutes,
                    Request_Origin__c = 'Case',
                    Request_Status__c = 'Completed',
                    Type__c = 'Name Plate',
                    Supplier_Name_Plate__c = supplierApiName
                );
                insert r;

                // 4. Link Request back to Case
                c.Request__c = r.Id;
                update c;

                // 5. Determine ContactId for renter
                Id renterContactId = acc.PersonContactId != null ? acc.PersonContactId : req.contactId;

                // 6. Send Email to Supplier (logs activity but only sends to supplier)
                try {
                    if (!String.isBlank(supplierEmail) && req.supplierTemplateId != null) {
                        Messaging.SingleEmailMessage supplierMail = new Messaging.SingleEmailMessage();
                        supplierMail.setTemplateId(req.supplierTemplateId);
                        supplierMail.setWhatId(c.Id); // tie to Case
                        supplierMail.setSaveAsActivity(true);
                        supplierMail.setTargetObjectId(UserInfo.getUserId()); // ensure Case activity logging
                        supplierMail.setTreatTargetObjectAsRecipient(false);  // prevent adding user as recipient
                        supplierMail.setToAddresses(new List<String>{ supplierEmail }); // supplier only
                        Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ supplierMail });
                    }
                } catch (Exception e) {
                    System.debug('Email to supplier skipped or failed: ' + e.getMessage());
                }

                // 7. Send Email to Renter (logs on Case + Contact)
                try {
                    if (!String.isBlank(acc.PersonEmail) && req.renterTemplateId != null) {
                        Messaging.SingleEmailMessage renterMail = new Messaging.SingleEmailMessage();
                        renterMail.setTemplateId(req.renterTemplateId);
                        renterMail.setWhatId(c.Id);
                        renterMail.setSaveAsActivity(true);
                        if (renterContactId != null) {
                            renterMail.setTargetObjectId(renterContactId);
                        }
                        renterMail.setToAddresses(new List<String>{ acc.PersonEmail });
                        Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ renterMail });
                    }
                } catch (Exception e) {
                    System.debug('Email to renter skipped or failed: ' + e.getMessage());
                }

                // 8. Save Email Confirmation for Supplier
                if (req.supplierTemplateId != null) {
                    List<EmailTemplate> supplierTemplates = [
                        SELECT Id, Name, DeveloperName, Subject, Description
                        FROM EmailTemplate
                        WHERE Id = :req.supplierTemplateId
                        LIMIT 1
                    ];
                    if (!supplierTemplates.isEmpty()) {
                        EmailTemplate tmplSupplier = supplierTemplates[0];
                        String emailBodySupplier = 'Email sent to Supplier using Template: ' + tmplSupplier.Name +
                                                   '\nSubject: ' + tmplSupplier.Subject +
                                                   '\nCase: ' + c.CaseNumber +
                                                   '\nDate: ' + Datetime.now().format('yyyy-MM-dd HH:mm');

                        ContentVersion cvSupplier = new ContentVersion(
                            Title = 'Email Confirmation (Supplier) - ' + c.CaseNumber,
                            PathOnClient = 'CaseEmailConfirmationSupplier.txt',
                            VersionData = Blob.valueOf(emailBodySupplier),
                            Origin = 'H'
                        );
                        insert cvSupplier;

                        ContentDocumentLink linkSupplier = new ContentDocumentLink(
                            ContentDocumentId = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :cvSupplier.Id].ContentDocumentId,
                            LinkedEntityId = c.Id,
                            ShareType = 'V',
                            Visibility = 'AllUsers'
                        );
                        insert linkSupplier;
                    }
                }

                // 9. Save Email Confirmation for Renter
                if (req.renterTemplateId != null) {
                    List<EmailTemplate> renterTemplates = [
                        SELECT Id, Name, DeveloperName, Subject, Description
                        FROM EmailTemplate
                        WHERE Id = :req.renterTemplateId
                        LIMIT 1
                    ];
                    if (!renterTemplates.isEmpty()) {
                        EmailTemplate tmplRenter = renterTemplates[0];
                        String emailBodyRenter = 'Email sent to Renter using Template: ' + tmplRenter.Name +
                                                 '\nSubject: ' + tmplRenter.Subject +
                                                 '\nCase: ' + c.CaseNumber +
                                                 '\nDate: ' + Datetime.now().format('yyyy-MM-dd HH:mm');

                        ContentVersion cvRenter = new ContentVersion(
                            Title = 'Email Confirmation (Renter) - ' + c.CaseNumber,
                            PathOnClient = 'CaseEmailConfirmationRenter.txt',
                            VersionData = Blob.valueOf(emailBodyRenter),
                            Origin = 'H'
                        );
                        insert cvRenter;

                        ContentDocumentLink linkRenter = new ContentDocumentLink(
                            ContentDocumentId = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :cvRenter.Id].ContentDocumentId,
                            LinkedEntityId = c.Id,
                            ShareType = 'V',
                            Visibility = 'AllUsers'
                        );
                        insert linkRenter;
                    }
                }

                // 10. Set Case to Closed
                c.Status = 'Closed';
                update c;

                // 11. Populate Response
                res.caseId = c.Id;
                res.requestId = r.Id;
                res.status = 'SUCCESS';
                res.supplierApiName = supplierApiName;
                res.supplierName = supplierName;
                res.supplierEmail = supplierEmail;
                res.weijntjesApiName = weijntjesApiName;
                res.weijntjesName = weijntjesName;
                res.weijntjesEmail = weijntjesEmail;

            } catch (Exception e) {
                System.debug('Error: ' + e.getMessage());
                res.status = 'ERROR: ' + e.getMessage();
            }
            results.add(res);
        }
        return results;
    }
}