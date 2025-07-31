public with sharing class CaseTimelineController {

    /**
     * Fetches up to 50 recent cases for a specific Account.
     * This is used by the woonstadCaseTimeline LWC to display the timeline.
     *
     * @param accountId The Id of the Account to retrieve cases for.
     * @return A list of Case records (Id, CaseNumber, Subject, Status, CreatedDate).
     */
    @AuraEnabled(cacheable=true)
    public static List<Case> getCasesForAccount(Id accountId) {
        if (accountId == null) {
            throw new AuraHandledException('AccountId is required to fetch related cases.');
        }

        List<Case> caseList = [
            SELECT Id,
                   CaseNumber,
                   Subject,
                   Status,
                   CreatedDate
            FROM Case
            WHERE AccountId = :accountId
            ORDER BY CreatedDate DESC
            LIMIT 50
        ];

        return caseList;
    }
}