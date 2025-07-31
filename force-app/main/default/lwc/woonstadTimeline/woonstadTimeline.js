/**
 * =============================================
 * WoonstadCaseTimeline.js
 * =============================================
 * Date: 2025-07-31
 * Last Changed: 2025-07-31
 * Description:
 * Lightning Web Component to display recent Cases
 * for a given Account in a timeline layout.
 * - Fetches cases from Apex via recordId input.
 * - Displays case details in a styled timeline.
 * - Uses a static Case icon for each entry.
 */

import { LightningElement, api, track } from 'lwc';
import getCasesForAccount from '@salesforce/apex/CaseTimelineController.getCasesForAccount';
import CASE_ICON from '@salesforce/resourceUrl/CaseIcon';

export default class WoonstadCaseTimeline extends LightningElement {
    /** Salesforce record Id for the Account */
    @api recordId;

    /** Icon used in the timeline (from static resource) */
    iconUrl = CASE_ICON;

    /** Case list and error state */
    @track cases = [];
    @track error;

    /**
     * Lifecycle hook - fetches cases when component loads.
     */
    connectedCallback() {
        if (this.recordId) {
            getCasesForAccount({ accountId: this.recordId })
                .then((result) => {
                    // Optionally sort cases by CreatedDate descending
                    this.cases = result.sort(
                        (a, b) => new Date(b.CreatedDate) - new Date(a.CreatedDate)
                    );
                })
                .catch((error) => {
                    console.error('Error loading cases:', error);
                    this.error = error;
                    // Future improvement: show toast notification instead of only console.error
                });
        } else {
            console.warn('No recordId provided to WoonstadCaseTimeline');
        }
    }

    /**
     * Handles clicks on a case subject or number.
     * Future enhancement: navigate directly to case record page.
     */
    handleClick(event) {
        const clickedText = event.target.textContent;
        console.log('Case clicked:', clickedText);
    }

    /**
     * Handles "Load more" click.
     * Future enhancement: support pagination or open modal with full case list.
     */
    handleMore() {
        console.log('Load more clicked');
    }
}