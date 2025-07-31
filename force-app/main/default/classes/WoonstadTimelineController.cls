/**
 * =============================================
 * WoonstadTimelineController
 * =============================================
 * Date: 2025-07-31
 * Last Changed: 2025-07-31
 * Description:
 * Apex controller to fetch the most recent Cases 
 * for a given Account. Used in timeline components 
 * to display customer case history.
 */

public with sharing class WoonstadTimelineController {

    /**
     * Fetches up to 100 most recent Case records 
     * for the given Account.
     *
     * @param accountId The Id of the Account to fetch Cases for
     * @return List<Case> containing up to 100 Cases, ordered by CreatedDate DESC
     */
    @AuraEnabled(cacheable=true)
    public static List<Case> getCasesForAccount(Id accountId) {
        // Return an empty list if no AccountId was provided
        if (String.isBlank(accountId)) {
            return new List<Case>();
        }
        
        // Query the most recent 100 Cases linked to the Account
        return [
            SELECT Id, Subject, CaseNumber, Status, CreatedDate
            FROM Case
            WHERE AccountId = :accountId
            ORDER BY CreatedDate DESC
            LIMIT 100
        ];
    }
}