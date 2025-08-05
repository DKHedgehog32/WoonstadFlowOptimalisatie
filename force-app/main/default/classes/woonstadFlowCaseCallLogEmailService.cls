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
 *          (TargetObjectId renter + treatTargetObjectAsRecipient=false)
 *      (2) To the Renter using renterTemplateId (native logging)
 * - Supplier emails are logged as EmailMessage + ContentVersion.
 * - Renter emails auto-log via SaveAsActivity.
 * - Updates the Case status to 'Closed'.
 * - Copies Label__c from Account to Case.
 */
public with sharing class woonstadFlowCaseCallLogEmailService {
    
    // ========== Flow Input ==========
    public class Request {
        @InvocableVariable(required=true) public Id accountId;
        @InvocableVariable(required=true) public Id contactId; 
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

        // Supplier outputs
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
                Datetime startTime;
                Integer processMinutes = 0;
                if (String.isNotBlank(req.flowStartTime)) {
                    try {
                        startTime = Datetime.valueOf(req.flowStartTime);
                        Long diffMillis = Datetime.now().getTime() - startTime.getTime();
                        processMinutes = Integer.valueOf(Math.floor((Decimal)diffMillis / (1000 * 60)));
                    } catch (Exception e) {
                        System.debug('Could not parse flowStartTime: ' + e.getMessage());
                    }
                }

                // Fetch Account
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

                // Create Case
                Id runningUserId = UserInfo.getUserId();
                Case c = new Case(
                    Subject = 'Aanvraag naamplaatje voor ' + acc.Full_Shipping_Street__c,
                    Description = 'Aanvraag naamplaatje voor:\n' +
                                  (acc.Full_Shipping_Street__c != null ? acc.Full_Shipping_Street__c + '\n' : '') +
                                  (acc.Full_Shipping_Postal_Code__c != null ? acc.Full_Shipping_Postal_Code__c + '\n' : '') +
                                  (acc.Full_Shipping_City__c != null ? acc.Full_Shipping_City__c + '\n' : '') +
                                  (acc.Full_Shipping_Country__c != null ? acc.Full_Shipping_Country__c + '\n' : '') +
                                  'Aangevraagd door ' + acc.Name,
                    OwnerId = runningUserId,
                    AccountId = req.accountId,
                    Origin = req.caseOrigin,
                    Nameplate_Text__c = req.nameplateText,
                    Label__c = acc.Label__c,
                    Status = 'New'
                );
                insert c;

                // Supplier info
                RealEstateSupplierFlowController.SupplierWrapper supplier =
                    RealEstateSupplierFlowController.getFirstSupplier(req.accountId);

                String supplierApiName = supplier != null ? supplier.supplierApiName : null;
                String supplierName    = !String.isBlank(req.supplierNameInput) 
                                          ? req.supplierNameInput 
                                          : (supplier != null ? supplier.supplierName : null);
                String supplierEmail   = !String.isBlank(req.supplierEmailInput) 
                                          ? req.supplierEmailInput 
                                          : (supplier != null ? supplier.supplierEmail : null);

                // Static Weijntjes fallback
                String weijntjesApiName = supplier != null ? supplier.weijntjesApiName : 'Weijntjes Hang- En Sluitwerk';
                String weijntjesName    = supplier != null ? supplier.weijntjesName : 'Weijntjes Hang- En Sluitwerk';
                String weijntjesEmail   = supplier != null ? supplier.weijntjesEmail : 'dennis.kristoffers@cobracrm.nl';

                // Create Request
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

                c.Request__c = r.Id;
                update c;

                // Determine renter target
                Id renterTargetId = acc.PersonContactId != null ? acc.PersonContactId : req.contactId;
                if (renterTargetId == null) renterTargetId = UserInfo.getUserId();

                // ---- Supplier Email ----
                try {
                    if (!String.isBlank(supplierEmail) && req.supplierTemplateId != null) {
                        Messaging.SingleEmailMessage supplierMail = new Messaging.SingleEmailMessage();
                        supplierMail.setTemplateId(req.supplierTemplateId);
                        supplierMail.setWhatId(c.Id);
                        supplierMail.setTargetObjectId(renterTargetId); // Required for merge
                        supplierMail.setTreatTargetObjectAsRecipient(false); // Prevent renter delivery
                        supplierMail.setSaveAsActivity(false); // We log manually
                        supplierMail.setToAddresses(new List<String>{ supplierEmail });
                        Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ supplierMail });

                        // Log manually as EmailMessage
                        EmailTemplate tmplSupplier = [
                            SELECT Id, Subject, HtmlValue, Body
                            FROM EmailTemplate
                            WHERE Id = :req.supplierTemplateId
                            LIMIT 1
                        ];
                        String mergedSubject = resolveTemplateFields(tmplSupplier.Subject, acc, c);
                        String mergedBody = resolveTemplateFields(
                            tmplSupplier.Body != null ? tmplSupplier.Body : tmplSupplier.HtmlValue, acc, c
                        );

                        EmailMessage em = new EmailMessage(
                            ParentId    = c.Id,
                            Status      = '3',
                            FromAddress = UserInfo.getUserEmail(),
                            FromName    = UserInfo.getName(),
                            ToAddress   = supplierEmail,
                            Subject     = mergedSubject,
                            TextBody    = mergedBody,
                            MessageDate = System.now(),
                            Incoming    = false
                        );
                        insert em;

                        // ContentVersion logging
                        String emailBodySupplier = 'Email sent to Supplier: ' + supplierEmail +
                                                   '\nSubject: ' + mergedSubject +
                                                   '\n\n' + mergedBody;
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
                } catch (Exception e) {
                    System.debug('Supplier email failed: ' + e.getMessage());
                }

                // ---- Renter Email ----
                try {
                    if (!String.isBlank(acc.PersonEmail) && req.renterTemplateId != null) {
                        Messaging.SingleEmailMessage renterMail = new Messaging.SingleEmailMessage();
                        renterMail.setTemplateId(req.renterTemplateId);
                        renterMail.setWhatId(c.Id);
                        renterMail.setSaveAsActivity(true);
                        renterMail.setTargetObjectId(renterTargetId);
                        renterMail.setToAddresses(new List<String>{ acc.PersonEmail });
                        Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ renterMail });
                    }
                } catch (Exception e) {
                    System.debug('Renter email failed: ' + e.getMessage());
                }

                // Close Case
                c.Status = 'Closed';
                update c;

                // Response
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

    // Utility: Replace merge fields dynamically
    private static String resolveTemplateFields(String template, Account acc, Case c) {
        if (String.isBlank(template)) return '';
        Map<String, String> values = new Map<String, String>{
            '{!Account.Name}' => acc.Name,
            '{!Account.PersonEmail}' => acc.PersonEmail,
            '{!Account.Full_Shipping_Street__c}' => acc.Full_Shipping_Street__c,
            '{!Account.Full_Shipping_Postal_Code__c}' => acc.Full_Shipping_Postal_Code__c,
            '{!Account.Full_Shipping_City__c}' => acc.Full_Shipping_City__c,
            '{!Account.Full_Shipping_Country__c}' => acc.Full_Shipping_Country__c,
            '{!Account.Label__c}' => acc.Label__c,
            '{!Case.Subject}' => c.Subject,
            '{!Case.Description}' => c.Description,
            '{!Case.Nameplate_Text__c}' => c.Nameplate_Text__c
        };
        for (String key : values.keySet()) {
            template = template.replace(key, values.get(key) != null ? values.get(key) : '');
        }
        return template;
    }
}