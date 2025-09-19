# Spacing Consistency Analysis Report

Generated: 2025-09-19T01:08:53.122Z

## Summary

- **Files Analyzed**: 112
- **Issues Found**: 173
- **Components with Issues**: 87

## Analysis Results

### Issues by File

#### components\admin\ErrorMonitoringDashboard.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-6, p-3, p-4, p-2
- Lines: 206, 238, 312, 352, 355, 392, 410, 443, 469

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\animations\index.ts

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding

#### components\animations\loading-states.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout

#### components\animations\micro-interactions.tsx

**Type**: components

**HARDCODED-PIXELS**

- Found inconsistent values: 3, 15
- **Suggestions**:
  - Replace 3px with var(--space-0-5) (2px)
  - Replace 15px with var(--space-3-5) (14px)

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding

#### components\auth\EmailVerificationRequired.tsx

**Type**: components

**PADDING**

- Found inconsistent values: px-6, px-8, px-4, px-10
- Lines: 43, 69, 84, 90, 99

**PADDING**

- Found inconsistent values: py-12, py-8, py-3, py-2
- Lines: 43, 69, 84, 90, 99

#### components\auth\ProtectedRoute.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\billing\BillingDashboard.tsx

**Type**: components

**GAP**

- Found inconsistent values: space-y-6, space-y-0, space-y-4, space-y-2, space-y-3
- Lines: 171, 191, 195, 213, 232, 250, 256, 275, 288, 330, 351, 359, 393

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\calendar\calendar-view.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-6, p-4, p-2, p-1, p-0, p-3
- Lines: 213, 214, 228, 230, 261, 266, 274, 283, 414, 431, 511, 521, 602, 606, 700, 701, 702, 712, 720, 773, 783, 803

**HARDCODED-PIXELS**

- Found inconsistent values: 120
- **Suggestions**:
  - Consider changing 120px to 120px (follows 4px grid)

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\calendar\status-indicator.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using form-spacing-standard class for consistent form layout

#### components\campaigns\CalendarView.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-2, p-4, p-6, p-1
- Lines: 213, 226, 236, 257, 259, 261, 268, 272, 295, 333

**HARDCODED-PIXELS**

- Found inconsistent values: 120
- **Suggestions**:
  - Consider changing 120px to 120px (follows 4px grid)

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\campaigns\CampaignContentCalendar.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-4, p-1, p-2, p-3
- Lines: 212, 214, 226, 238, 250, 282, 353, 356, 365, 382, 404, 421, 488, 494, 507

**GAP**

- Found inconsistent values: space-y-6, space-y-4, space-y-1, space-y-2
- Lines: 198, 210, 338, 378, 400, 401, 477

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\campaigns\CampaignGenerator.tsx

**Type**: components

**MARGIN**

- Found inconsistent values: mb-6, mb-2, mb-4, mb-1
- Lines: 87, 110, 123, 160, 178, 196, 209, 220, 234, 263, 266, 279, 292, 305, 322

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\client\asset-library.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-2, p-0, p-3, p-1, p-4, p-8
- Lines: 316, 318, 321, 324, 332, 354, 379, 408, 456, 472, 475, 478, 531, 548, 553, 570, 591, 613, 637

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\client\client-brand-switcher.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-1, p-3, p-2, p-4
- Lines: 179, 264, 290, 295, 317, 353, 355, 369, 379, 398, 414, 440

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using form-spacing-standard class for consistent form layout

#### components\clients\ClientManagementInterface.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-6, p-3, p-4, p-2
- Lines: 206, 281, 290, 304, 391, 427, 461, 478, 529

**GAP**

- Found inconsistent values: space-y-6, space-y-4, space-y-2, space-y-3
- Lines: 217, 240, 300, 338, 346, 360, 405, 424, 518, 527, 565, 574

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\content\AIContentGenerationInterface.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\content\AIGenerationWorkflow.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-6, p-0, p-4, p-2, p-3
- Lines: 219, 305, 307, 350, 391, 428, 479

**GAP**

- Found inconsistent values: space-x-2, space-x-1, space-x-4, space-x-3
- Lines: 196, 245, 273, 294, 323, 369, 436, 468, 480

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\content\ContentVersionComparator.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-4, p-3, p-1, p-2, p-0, p-6
- Lines: 222, 286, 300, 317, 332, 360, 462, 471, 500, 506, 525, 531, 583, 604

**GAP**

- Found inconsistent values: gap-1, gap-4, gap-6, gap-2
- Lines: 300, 360, 500, 583, 604

**GAP**

- Found inconsistent values: space-y-4, space-y-2, space-y-6, space-y-3
- Lines: 219, 262, 265, 281, 295, 312, 325, 330, 405, 463, 523, 550

**HARDCODED-PIXELS**

- Found inconsistent values: 100
- **Suggestions**:
  - Replace 100px with var(--space-24) (96px)

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\content\ContentVersionHistory.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-4, p-2, p-3, p-1, p-6
- Lines: 324, 345, 423, 434, 455, 490, 567, 582, 590, 637, 663, 671

**GAP**

- Found inconsistent values: gap-4, gap-2, gap-1, gap-6
- Lines: 324, 345, 434, 455, 567, 590, 637, 671

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\content\PostApprovalWorkflow.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-6, p-4, p-3, p-2, p-1
- Lines: 318, 350, 354, 402, 414, 432, 499, 510, 531, 599, 635, 699, 813

**GAP**

- Found inconsistent values: gap-6, gap-4, gap-1, gap-2
- Lines: 318, 350, 402, 510, 531, 699, 813

**GAP**

- Found inconsistent values: space-y-6, space-y-3, space-y-4, space-y-2
- Lines: 317, 333, 410, 464, 472, 484, 557, 576, 597, 624, 633, 666, 674, 711, 770, 781

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\content\PublicationScheduler.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-6, p-4, p-2, p-1
- Lines: 234, 262, 325, 358, 375, 377, 395, 490, 491, 506, 539

**GAP**

- Found inconsistent values: space-y-6, space-y-0, space-y-4, space-y-2, space-y-3
- Lines: 233, 249, 264, 277, 290, 303, 317, 324, 356, 393, 479, 488, 538, 548, 580

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\dashboard\AgencyOverview.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\dashboard\bulk-selection-system.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-6, p-3, p-4, p-2
- Lines: 208, 209, 242, 371, 375, 383, 399, 411

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using form-spacing-standard class for consistent form layout

#### components\dashboard\content-grid.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-3, p-1, p-4, p-2
- Lines: 160, 167, 209, 216, 217, 245, 246, 273, 274, 472, 492, 522, 550, 629, 682, 683, 729, 735, 798, 816, 817

**GAP**

- Found inconsistent values: gap-3, gap-2, gap-4, gap-1
- Lines: 160, 216, 217, 245, 246, 273, 274, 472, 492, 522, 550, 629, 682, 735, 798, 817

**HARDCODED-PIXELS**

- Found inconsistent values: 100
- **Suggestions**:
  - Replace 100px with var(--space-24) (96px)

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\dashboard\DashboardOverview.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\dashboard\index.ts

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\design\AdvancedDesignGenerator.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-6, p-4, p-2, p-3, p-1
- Lines: 207, 215, 265, 276, 284, 489, 492, 507

**MARGIN**

- Found inconsistent values: mt-2, mt-1, mt-4, mt-6
- Lines: 265, 284, 315, 475, 528, 540

**GAP**

- Found inconsistent values: gap-6, gap-4, gap-2, gap-1
- Lines: 207, 215, 265, 284, 489, 507

**GAP**

- Found inconsistent values: space-y-6, space-y-4, space-y-2, space-y-1
- Lines: 193, 209, 214, 302, 371, 402, 409, 429, 468, 488, 506, 528

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\design-system-demo.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-8, p-4, p-6, p-2
- Lines: 11, 24, 90, 106, 107, 114, 121, 133, 165, 187, 188, 192, 196, 200, 204

**GAP**

- Found inconsistent values: space-y-8, space-y-4, space-y-2, space-y-1
- Lines: 12, 22, 26, 28, 38, 40, 50, 52, 62, 64, 74, 76, 88, 104, 131, 150, 152, 163, 185

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\dev\accessibility-audit.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding

#### components\integration\main-flow-integration.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using grid-spacing-standard class for consistent grid gaps
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\integration\page-transitions.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\integration\visual-consistency.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\integration\workflow-integration.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\mobile\mobile-form.tsx

**Type**: components

**HARDCODED-PIXELS**

- Found inconsistent values: 100
- **Suggestions**:
  - Replace 100px with var(--space-24) (96px)

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using form-spacing-standard class for consistent form layout

#### components\mobile\mobile-modal.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using form-spacing-standard class for consistent form layout

#### components\mobile\swipe-actions.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using form-spacing-standard class for consistent form layout

#### components\mobile\touch-feedback.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\navigation\breadcrumbs.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\navigation\index.ts

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\navigation\mobile-bottom-nav.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\navigation\mobile-header.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-0, p-1, p-4, p-3
- Lines: 108, 120, 152, 155, 159, 194, 197, 212, 275, 288, 321, 323, 333

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\navigation\navigation-sidebar.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\navigation\tour-progress-indicator.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\onboarding\analytics\ab-testing-dashboard.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\onboarding\analytics\real-time-analytics.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-3, p-2, p-4, p-0
- Lines: 109, 114, 139, 141, 142, 153, 154, 165, 166, 177, 178, 301, 320, 328, 360

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\onboarding\analytics\tour-metrics-dashboard.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-2, p-4, p-3, p-6
- Lines: 131, 184, 204, 205, 220, 243, 265, 281, 282, 358, 392, 434, 472, 478

**GAP**

- Found inconsistent values: space-y-0, space-y-4, space-y-2, space-y-1, space-y-6
- Lines: 71, 116, 126, 142, 183, 215, 242, 262, 357, 361, 389, 425, 433, 444, 450, 457, 470

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\onboarding\branded-tour-demo.tsx

**Type**: components

**GAP**

- Found inconsistent values: space-x-2, space-x-3, space-x-1, space-x-4
- Lines: 81, 90, 119, 143, 214, 243, 247, 257, 270, 279, 299

**GAP**

- Found inconsistent values: space-y-4, space-y-1, space-y-6, space-y-2
- Lines: 89, 136, 157, 158, 194

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\onboarding\driver-wrapper.tsx

**Type**: components

**HARDCODED-PIXELS**

- Found inconsistent values: 25, 50, 3
- **Suggestions**:
  - Replace 25px with var(--space-6) (24px)
  - Replace 50px with var(--space-12) (48px)
  - Replace 3px with var(--space-0-5) (2px)

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\onboarding\examples\responsive-tour-example.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-6, p-2, p-4, p-3
- Lines: 156, 168, 193, 224, 234, 244, 262, 301

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\onboarding\feature-discovery-panel.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-4, p-3, p-2, p-0, p-1
- Lines: 63, 64, 158, 163, 169, 186, 190, 198, 205, 340, 341, 347, 359, 368, 370, 378, 383, 404, 472, 477, 483, 498, 503

**MARGIN**

- Found inconsistent values: mb-4, mb-3, mb-2, mb-1
- Lines: 189, 205, 265, 293, 347, 359, 364, 365, 483, 498

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout

#### components\onboarding\mobile\mobile-tour-controls.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-2, p-3, p-4, p-1
- Lines: 383, 385, 387, 389, 400, 479, 481, 488, 502, 525, 539, 620, 653, 663, 671, 701, 708, 780

**PADDING**

- Found inconsistent values: py-2, py-3, py-6, py-4, py-1, py-0
- Lines: 383, 385, 387, 389, 527, 665

**GAP**

- Found inconsistent values: gap-2, gap-3, gap-4, gap-1
- Lines: 383, 385, 387, 389, 479, 481, 488, 502, 525, 539, 620, 653, 663, 671, 701, 708

**HARDCODED-PIXELS**

- Found inconsistent values: 60
- **Suggestions**:
  - Replace 60px with var(--space-14) (56px)

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\onboarding\mobile\mobile-tour-layout.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\onboarding\mobile\mobile-tour-popover.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-20, p-1, p-3, p-2
- Lines: 224, 226, 273, 316, 364, 368, 374, 387, 421

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\onboarding\mobile\mobile-tour-spotlight.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\onboarding\tour-accessibility-test.tsx

**Type**: components

**GAP**

- Found inconsistent values: space-y-4, space-y-3, space-y-2, space-y-1
- Lines: 128, 177, 216, 276, 286

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using grid-spacing-standard class for consistent grid gaps
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\onboarding\tour-aria-description.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\onboarding\tour-controls.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-2, p-1, p-3, p-4
- Lines: 269, 271, 273, 280, 311, 353, 366, 380, 413, 421

**PADDING**

- Found inconsistent values: py-2, py-1, py-3, py-0
- Lines: 269, 271, 273, 372

**HARDCODED-PIXELS**

- Found inconsistent values: 100
- **Suggestions**:
  - Replace 100px with var(--space-24) (96px)

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\onboarding\tour-help-menu.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-0, p-1, p-6, p-4, p-3, p-2
- Lines: 187, 218, 221, 235, 243, 247, 275, 301, 303, 315, 324, 337, 343, 359

**GAP**

- Found inconsistent values: space-x-3, space-x-2, space-x-4, space-x-1
- Lines: 250, 278, 345, 364, 365, 369

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\onboarding\tour-library.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-1, p-0, p-4, p-6, p-3
- Lines: 241, 246, 254, 280, 296, 298, 301, 388, 397, 418, 443, 460

**GAP**

- Found inconsistent values: space-x-2, space-x-3, space-x-4, space-x-1
- Lines: 239, 352, 399, 423, 424, 428, 445, 456, 463, 465, 469

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\onboarding\tour-management-hub.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-0, p-1, p-6, p-4
- Lines: 91, 122, 128, 134, 152, 159, 167, 181, 188, 189, 193, 227, 228, 242, 260

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\onboarding\tour-popover.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\onboarding\tour-provider.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\onboarding\tour-replay-manager.tsx

**Type**: components

**MARGIN**

- Found inconsistent values: mb-4, mb-2, mb-1, mb-3
- Lines: 236, 237, 254, 258, 261, 330, 348

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\onboarding\tour-settings.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-1, p-6, p-3, p-8, p-4
- Lines: 289, 320, 411, 419, 444, 450, 455, 491, 621, 631, 683, 684, 698, 723

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\onboarding\tour-ui-demo.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-8, p-6, p-4, p-1
- Lines: 86, 105, 128, 131, 153

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\premium-components-demo.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-8, p-6, p-3, p-4
- Lines: 75, 90, 93, 112, 131, 154, 216, 227, 256, 266

**MARGIN**

- Found inconsistent values: mb-12, mb-4, mb-16, mb-6
- Lines: 77, 78, 88, 89, 152, 153, 207, 208

**GAP**

- Found inconsistent values: gap-8, gap-6, gap-3, gap-4
- Lines: 90, 154, 216, 227, 266

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\social\SocialAccountManager.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\testing\ab-testing.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-2, p-4, p-6, p-1
- Lines: 152, 158, 186, 192, 204, 216, 228, 237, 260, 294, 312, 317, 331, 347, 357, 390, 414, 419, 430

**GAP**

- Found inconsistent values: gap-2, gap-4, gap-6, gap-1
- Lines: 152, 158, 186, 192, 204, 216, 228, 237, 294, 317, 331, 347, 357

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\testing\feedback-dashboard.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-2, p-6, p-4, p-3, p-1
- Lines: 151, 164, 250, 276, 327, 332, 339, 355, 387, 390, 404, 432, 455, 472, 480, 488, 496

**GAP**

- Found inconsistent values: gap-2, gap-6, gap-4, gap-3, gap-1
- Lines: 151, 164, 250, 276, 327, 332, 387, 390, 404, 432, 455, 472, 480, 488, 496

**GAP**

- Found inconsistent values: space-y-6, space-y-0, space-y-4, space-y-3
- Lines: 142, 166, 179, 202, 225, 241, 248, 323, 369, 429, 440, 470

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\testing\usability-testing-interface.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-6, p-2, p-4, p-1
- Lines: 143, 151, 160, 167, 171, 175, 194, 200, 227, 233, 260, 267, 273, 279, 322, 325, 343, 376, 384, 394, 408, 418, 423, 438, 453

**GAP**

- Found inconsistent values: gap-6, gap-2, gap-4, gap-1
- Lines: 151, 160, 167, 171, 175, 194, 200, 233, 260, 273, 279, 322, 325, 343, 418, 453

**GAP**

- Found inconsistent values: space-y-6, space-y-4, space-y-1, space-y-2
- Lines: 143, 144, 166, 199, 203, 212, 227, 266, 348, 384, 388

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\ui\alert-dialog.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-3, p-0, p-6, p-2
- Lines: 181, 213, 251, 252

#### components\ui\button.tsx

**Type**: components

**PADDING**

- Found inconsistent values: px-3, px-4, px-6, px-8
- Lines: 79, 80, 81, 82

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\ui\calendar.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using nav-item-spacing class for consistent navigation spacing

#### components\ui\card.stories.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\ui\card.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-4, p-6, p-8, p-10
- Lines: 61, 62, 63, 64

**HARDCODED-PIXELS**

- Found inconsistent values: 11
- **Suggestions**:
  - Replace 11px with var(--space-2-5) (10px)

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout

#### components\ui\content-card.stories.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\ui\content-card.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-3, p-1, p-2, p-4
- Lines: 202, 216, 230, 254, 276, 283, 325, 327, 331, 343

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout

#### components\ui\dialog.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using grid-spacing-standard class for consistent grid gaps

#### components\ui\modal-manager.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using form-spacing-standard class for consistent form layout

#### components\ui\modal.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-4, p-0, p-6, p-2, p-3
- Lines: 199, 231, 270, 271

#### components\ui\optimized-image.tsx

**Type**: components

**HARDCODED-PIXELS**

- Found inconsistent values: 50
- **Suggestions**:
  - Replace 50px with var(--space-12) (48px)

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using form-spacing-standard class for consistent form layout

#### components\ui\progress.tsx

**Type**: components

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using form-spacing-standard class for consistent form layout

#### components\ui\toast.tsx

**Type**: components

**PADDING**

- Found inconsistent values: p-3, p-4, p-2, p-1
- Lines: 104, 128, 134, 145, 160

#### styles\contrast-fixes.css

**Type**: styles

**HARDCODED-PIXELS**

- Found inconsistent values: 3, 25
- **Suggestions**:
  - Replace 3px with var(--space-0-5) (2px)
  - Replace 25px with var(--space-6) (24px)

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using card-spacing-standard class for consistent card padding
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using nav-item-spacing class for consistent navigation spacing

#### styles\sidebar-layout-fixes.css

**Type**: styles

**HARDCODED-PIXELS**

- Found inconsistent values: 3, 15, 5
- **Suggestions**:
  - Replace 3px with var(--space-0-5) (2px)
  - Replace 15px with var(--space-3-5) (14px)
  - Replace 5px with var(--space-1) (4px)

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using nav-item-spacing class for consistent navigation spacing

#### styles\themes.css

**Type**: styles

**HARDCODED-PIXELS**

- Found inconsistent values: 3, 15, 25, 5, 50
- **Suggestions**:
  - Replace 3px with var(--space-0-5) (2px)
  - Replace 15px with var(--space-3-5) (14px)
  - Replace 25px with var(--space-6) (24px)
  - Replace 5px with var(--space-1) (4px)
  - Replace 50px with var(--space-12) (48px)

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using form-spacing-standard class for consistent form layout
  - Consider using nav-item-spacing class for consistent navigation spacing

#### styles\tokens.css

**Type**: styles

**HARDCODED-PIXELS**

- Found inconsistent values: 3, 18, 30, 60, 15, 25, 5, 50
- **Suggestions**:
  - Replace 3px with var(--space-0-5) (2px)
  - Replace 18px with var(--space-4) (16px)
  - Replace 30px with var(--space-7) (28px)
  - Replace 60px with var(--space-14) (56px)
  - Replace 15px with var(--space-3-5) (14px)
  - Replace 25px with var(--space-6) (24px)
  - Replace 5px with var(--space-1) (4px)
  - Replace 50px with var(--space-12) (48px)

**MISSING-SPACING-CLASSES**

- **Suggestions**:
  - Consider using grid-spacing-standard class for consistent grid gaps

## Spacing System Reference

### Available Spacing Classes

#### Padding Classes
- `.spacing-p-xs` - 4px padding
- `.spacing-p-sm` - 8px padding  
- `.spacing-p-md` - 16px padding
- `.spacing-p-lg` - 24px padding
- `.spacing-p-xl` - 32px padding

#### Margin Classes
- `.spacing-m-xs` - 4px margin
- `.spacing-m-sm` - 8px margin
- `.spacing-m-md` - 16px margin
- `.spacing-m-lg` - 24px margin
- `.spacing-m-xl` - 32px margin

#### Component-Specific Classes
- `.card-spacing-standard` - Standard card padding (24px)
- `.form-spacing-standard` - Standard form spacing
- `.grid-spacing-standard` - Standard grid gap (16px)
- `.nav-item-spacing` - Standard navigation item spacing

### Design Token Reference

- `var(--space-0)` = 0px
- `var(--space-px)` = 1px
- `var(--space-0-5)` = 2px
- `var(--space-1)` = 4px
- `var(--space-1-5)` = 6px
- `var(--space-2)` = 8px
- `var(--space-2-5)` = 10px
- `var(--space-3)` = 12px
- `var(--space-3-5)` = 14px
- `var(--space-4)` = 16px
- `var(--space-5)` = 20px
- `var(--space-6)` = 24px
- `var(--space-7)` = 28px
- `var(--space-8)` = 32px
- `var(--space-9)` = 36px
- `var(--space-10)` = 40px
- `var(--space-11)` = 44px
- `var(--space-12)` = 48px
- `var(--space-14)` = 56px
- `var(--space-16)` = 64px
- `var(--space-20)` = 80px
- `var(--space-24)` = 96px
- `var(--space-28)` = 112px
- `var(--space-32)` = 128px


## Recommendations

### High Priority
1. Replace hardcoded pixel values with design tokens
2. Use component-specific spacing classes for consistency
3. Ensure all spacing follows the 4px grid system

### Medium Priority
1. Standardize spacing in similar components
2. Use utility classes for common spacing patterns
3. Add spacing classes to components missing them

### Low Priority
1. Consider responsive spacing adjustments
2. Review and optimize spacing for mobile devices
3. Add spacing debugging helpers during development

## Next Steps

1. **Fix Critical Issues**: Address hardcoded pixel values first
2. **Apply Spacing Classes**: Use the new spacing system classes
3. **Test Changes**: Verify visual consistency after changes
4. **Update Components**: Gradually migrate components to use standard spacing
5. **Monitor**: Set up linting rules to prevent future inconsistencies

---

*This report was generated by the Spacing Consistency Analyzer*
