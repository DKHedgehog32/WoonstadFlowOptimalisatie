/**
 * =============================================
 * RealEstateSupplierFlowController
 * =============================================
 * Date: 2025-07-31
 * Last Changed: 2025-07-31
 * Description:
 * Provides supplier information for a given Account,
 * based on the first active Contract Contact Role.
 * Supplier details (API name, display name, and email)
 * are determined dynamically from the "eigenaar".
 * Also includes static Weijntjes Hang- En Sluitwerk.
 */
public with sharing class RealEstateSupplierFlowController {
    
    @AuraEnabled(cacheable=true)
    public static SupplierWrapper getFirstSupplier(Id accountId) {
        // Fetch the Account with address fields
        Account acc = [
            SELECT Id, Name, Full_Shipping_Street__c, 
                   Full_Shipping_Postal_Code__c, Full_Shipping_City__c
            FROM Account
            WHERE Id = :accountId
            LIMIT 1
        ];

        // Fetch the first active Contract Contact Role for this Account
        List<Contract_Contact_Role__c> roles = [
            SELECT Id,
                   Real_Estate_Contract__r.Contract_Party__r.Name,
                   Real_Estate_Contract__r.Contract_Party__c
            FROM Contract_Contact_Role__c
            WHERE Active__c = true
            AND Contact_Account__c = :accountId
            LIMIT 1
        ];

        String eigenaar;
        String supplierApiName;
        String supplierName;
        String supplierEmail;

        if (!roles.isEmpty()) {
            Contract_Contact_Role__c role = roles[0];
            eigenaar = role.Real_Estate_Contract__r.Contract_Party__r.Name;

            if (eigenaar != null) {
                if (eigenaar.containsIgnoreCase('Noord') || eigenaar.containsIgnoreCase('Oost')) {
                    supplierApiName = 'Kellers IJzerhandel B.V.';
                    supplierName    = 'Keller\'s IJzerhandel B.V.';
                    supplierEmail   = 'denniskristoffers@icloud.com';
                } else if (eigenaar.containsIgnoreCase('Zuid')) {
                    supplierApiName = 'Het Zuider Sleutelhuis B.V.';
                    supplierName    = 'Het Zuider Sleutelhuis B.V.';
                    supplierEmail   = 'denniskristoffers@gmail.com';
                } else if (eigenaar.containsIgnoreCase('Centrum') || eigenaar.containsIgnoreCase('West')) {
                    supplierApiName = 'IJzerhandel Overschie';
                    supplierName    = 'IJzerhandel Overschie';
                    supplierEmail   = 'denniskristoffers@icloud.com';
                }
            }
        }

        // Static supplier: Weijntjes Hang- En Sluitwerk
        String staticSupplierApi = 'Weijntjes Hang- En Sluitwerk';
        String staticSupplierName = 'Weijntjes Hang- En Sluitwerk';
        String staticSupplierEmail = 'dennis.kristoffers@cobracrm.nl';

        return new SupplierWrapper(
            acc.Id,
            acc.Name,
            eigenaar,
            supplierApiName,
            supplierName,
            supplierEmail,
            acc.Full_Shipping_Street__c,
            acc.Full_Shipping_Postal_Code__c,
            acc.Full_Shipping_City__c,
            staticSupplierApi,
            staticSupplierName,
            staticSupplierEmail
        );
    }

    public class SupplierWrapper {
        @AuraEnabled public Id accountId;
        @AuraEnabled public String klantNaam;
        @AuraEnabled public String eigenaar;
        @AuraEnabled public String supplierApiName;
        @AuraEnabled public String supplierName;
        @AuraEnabled public String supplierEmail;
        @AuraEnabled public String fullStreet;
        @AuraEnabled public String postalCode;
        @AuraEnabled public String city;

        // Static Weijntjes outputs
        @AuraEnabled public String weijntjesApiName;
        @AuraEnabled public String weijntjesName;
        @AuraEnabled public String weijntjesEmail;

        public SupplierWrapper(Id accountId, String klantNaam, String eigenaar,
                               String supplierApiName, String supplierName, String supplierEmail,
                               String fullStreet, String postalCode, String city,
                               String weijntjesApiName, String weijntjesName, String weijntjesEmail) {
            this.accountId = accountId;
            this.klantNaam = klantNaam;
            this.eigenaar = eigenaar;
            this.supplierApiName = supplierApiName;
            this.supplierName = supplierName;
            this.supplierEmail = supplierEmail;
            this.fullStreet = fullStreet;
            this.postalCode = postalCode;
            this.city = city;
            this.weijntjesApiName = weijntjesApiName;
            this.weijntjesName = weijntjesName;
            this.weijntjesEmail = weijntjesEmail;
        }
    }
}