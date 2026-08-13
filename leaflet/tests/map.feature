Feature: Map canvas and DOM interaction
  As a QA engineer verifying map-based UI
  I want the map to render deterministically at a known view
  So that canvas clicks and visual assertions land on predictable pixels

  Scenario: Force a fixed view and click the fire-risk zone on canvas
    Given the map page is open
    When I force the map to center on the fire-risk zone at a fixed zoom
    And I wait for the basemap tiles to finish loading
    Then clicking the canvas at the fire-risk zone's projected pixel coordinate should hit inside the zone

  Scenario: Click the DOM marker directly, no coordinate math needed
    Given the map page is open
    When I force the map to center on the fire-risk zone at a fixed zoom
    Then I can click the fire-risk zone marker by its real DOM selector
