Feature: Map canvas interaction
  As a QA engineer verifying map-based UI
  I want the map to render deterministically at a known view
  So that canvas clicks and visual assertions land on predictable pixels

  Scenario: Force a fixed view and click the fire-risk zone
    Given the map page is open
    When I force the map to center on the fire-risk zone at a fixed zoom
    And I wait for the map to become idle
    Then clicking the canvas at the fire-risk zone's projected pixel coordinate should hit inside the zone
