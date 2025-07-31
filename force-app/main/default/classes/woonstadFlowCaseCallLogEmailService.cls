/**
 * =============================================
 * Woonstad Flow Case Call Log Email Service
 * =============================================
 * Date: 2025-07-31
 * Last Changed: 2025-07-31
 * Description:
 * Invocable Apex service for Salesforce Flow.
 * - Creates a Case and related Request__c record.
 * - Handles supplier information:
 *      Supplier_Name_Plate__c stores the API name
 *      Supplier display name & email used for sending.
 * - Always includes static Weijntjes Hang- En Sluitwerk.
 * - Sends email using a provided template.
 * - Logs email confirmation as a ContentVersion linked to the Case.
 */
public with sharing class woonstadFlowCaseCallLogEmailService {
    
    // ========== Flow Input ==========
    public class Request {
        @InvocableVariable(required=true) public Id accountId;
        @InvocableVariable(required=true) public Id contactId; // AccountId if Person Account
        @InvocableVariable(required=true) public Id templateId;
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
                        System.debug('⚠️ Could not parse flowStartTime: ' + req.flowStartTime + ' | ' + e.getMessage());
                    }
                }

                // Fetch Account data
                Account acc = [
                    SELECT Id, Name, PersonEmail,
                           Full_Shipping_Street__c,
                           Full_Shipping_Postal_Code__c,
                           Full_Shipping_City__c,
                           Full_Shipping_Country__c,
                           IsPersonAccount, PersonContactId
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

                // 1. Create Case
                Case c = new Case(
                    Subject = subjectText,
                    Description = descriptionText,
                    OwnerId = runningUserId,
                    AccountId = req.accountId,
                    Origin = req.caseOrigin,
                    Nameplate_Text__c = req.nameplateText,
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

                // 3. Create Request__c record (store API name, not display name)
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

                // 5. Person Account logic
                Id targetId = req.contactId;
                if (targetId != null && String.valueOf(targetId).startsWith('001')) {
                    if (acc.IsPersonAccount && acc.PersonContactId != null) {
                        targetId = acc.PersonContactId;
                    } else {
                        throw new AuraHandledException('Provided Account Id is not a Person Account or has no PersonContactId.');
                    }
                }

                // 6. Send Email
                try {
                    Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
                    mail.setTargetObjectId(targetId);
                    mail.setTemplateId(req.templateId);
                    mail.setWhatId(c.Id);
                    mail.setSaveAsActivity(true);

                    if (!String.isBlank(supplierEmail)) {
                        mail.setToAddresses(new List<String>{ supplierEmail });
                    }

                    Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
                } catch (Exception e) {
                    System.debug('⚠️ Email sending skipped or failed: ' + e.getMessage());
                }

                // 7. Save Email Confirmation
                EmailTemplate tmpl = [
                    SELECT Id, Name, DeveloperName, Subject, Description
                    FROM EmailTemplate
                    WHERE Id = :req.templateId
                    LIMIT 1
                ];

                String emailBody = 'Email sent using Template: ' + tmpl.Name +
                                   '\nSubject: ' + tmpl.Subject +
                                   '\nDescription: ' + (tmpl.Description != null ? tmpl.Description : 'No Description') +
                                   '\nCase: ' + c.CaseNumber +
                                   '\nDate: ' + Datetime.now().format('yyyy-MM-dd HH:mm');

                ContentVersion cv = new ContentVersion(
                    Title = 'Email Confirmation - ' + c.CaseNumber,
                    PathOnClient = 'CaseEmailConfirmation.txt',
                    VersionData = Blob.valueOf(emailBody),
                    Origin = 'H'
                );
                insert cv;

                ContentDocumentLink link = new ContentDocumentLink(
                    ContentDocumentId = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :cv.Id].ContentDocumentId,
                    LinkedEntityId = c.Id,
                    ShareType = 'V',
                    Visibility = 'AllUsers'
                );
                insert link;

                // 8. Populate Response
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
                System.debug('❌ Error: ' + e.getMessage());
                res.status = 'ERROR: ' + e.getMessage();
            }
            results.add(res);
        }
        return results;
    }
}