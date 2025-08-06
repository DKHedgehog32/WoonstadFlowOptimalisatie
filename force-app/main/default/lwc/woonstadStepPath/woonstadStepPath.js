/**
 * =============================================
 * WoonstadStepPath.js
 * =============================================
 * Date: 2025-08-05
 * Last Changed: 2025-08-05
 * Description:
 * Custom Step Path (progress indicator) for Woonstad flows.
 * - Renders dynamic steps from a JSON input string.
 * - Highlights current step, shows completed steps with checkmark.
 * - Displays tooltips only for the active step.
 * - Tooltip coordinates computed in JS to avoid inline CSS parsing errors.
 */

import { LightningElement, api } from 'lwc';

export default class WoonstadStepPath extends LightningElement {
    // Private variables for internal state
    _jsonInput;
    _stepsRaw = [];
    _currentStep = 0;

    // Public array used in the template to render steps
    steps = [];

    /**
     * API property: JSON string defining the steps.
     */
    @api
    set jsonInput(value) {
        this._jsonInput = value;
        this.parseJson(value);
    }
    get jsonInput() {
        return this._jsonInput;
    }

    /**
     * API property: Index of the current step (number).
     */
    @api
    set currentStep(value) {
        this._currentStep = Number(value);
        this.updateStepClasses();
    }
    get currentStep() {
        return this._currentStep;
    }

    /**
     * Parse the incoming JSON string into step objects.
     */
    parseJson(value) {
        try {
            this._stepsRaw = JSON.parse(value);
            this.updateStepClasses();
        } catch (error) {
            console.error('Invalid JSON for step path:', error);
            this._stepsRaw = [];
            this.steps = [];
        }
    }

    /**
     * Updates each step’s classes and state based on currentStep.
     */
    updateStepClasses() {
        if (!Array.isArray(this._stepsRaw)) {
            this.steps = [];
            return;
        }

        this.steps = this._stepsRaw.map(step => {
            const isCompleted = step.number < this._currentStep;
            const isActive = step.number === this._currentStep;

            return {
                ...step,
                circleClass: `step-circle ${isCompleted ? 'completed' : isActive ? 'active' : 'inactive'}`,
                labelClass: `step-label ${isActive ? 'active' : 'inactive'}`,
                isCompleted,
                isActive,
                displayValue: isCompleted ? '✓' : step.number,
                tooltip: step.tooltip || '',
                showTooltip: false,
                tooltipStyle: '' // placeholder, updated on hover
            };
        });
    }

    /**
     * Show tooltip for the hovered step,
     * but only if it’s the active step.
     * Computes fixed position so it always stays visible.
     */
    handleMouseOver(event) {
    const stepId = Number(event.currentTarget.dataset.id);
    const rect = event.currentTarget.querySelector('.step-circle').getBoundingClientRect();

    // Safe padding from screen edges
    const tooltipWidth = 280; // matches CSS min-width
    const screenPadding = 20;

    // Calculate centered position
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    let top = rect.top - 50;

    // Clamp position so tooltip stays in viewport
    if (left < screenPadding) {
        left = screenPadding;
    } else if (left + tooltipWidth > window.innerWidth - screenPadding) {
        left = window.innerWidth - tooltipWidth - screenPadding;
    }

    this.steps = this.steps.map(step => {
        if (step.number === stepId && step.number === this._currentStep) {
            return {
                ...step,
                showTooltip: true,
                tooltipStyle: `top:${top}px; left:${left}px; width:${tooltipWidth}px;`
            };
        }
        return { ...step, showTooltip: false, tooltipStyle: '' };
    });
}

    /**
     * Hide tooltip when mouse leaves the step.
     */
    handleMouseOut() {
        this.steps = this.steps.map(step => ({
            ...step,
            showTooltip: false,
            tooltipStyle: ''
        }));
    }
}