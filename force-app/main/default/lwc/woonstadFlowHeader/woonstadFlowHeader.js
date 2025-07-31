/**
 * =============================================
 * WoonstadFlowHeader.js
 * =============================================
 * Date: 2025-07-31
 * Last Changed: 2025-07-31
 * Description:
 * Lightning Web Component controller for displaying 
 * a branded header in Salesforce Flows.
 * - Shows the Woonstad logo (static resource).
 * - Accepts a title string from the Flow or App Builder.
 */

import { LightningElement, api } from 'lwc';
import LOGO from '@salesforce/resourceUrl/WSRLogo';

export default class WoonstadFlowHeader extends LightningElement {
    /**
     * The title to display in the Flow header.
     * Configurable via Flow or App Builder.
     */
    @api title = '';

    /**
     * URL reference to the Woonstad Rotterdam logo,
     * imported as a static resource for consistent branding.
     */
    logoUrl = LOGO;
}