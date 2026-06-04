# BikeBrowser Region TSCN Bundle

Purpose: single-file review bundle for sharing with a browser or external reviewer.

IMPORTANT: DO NOT GIVE THIS FILE TO OPENCLAW AND DO NOT ASK OPENCLAW TO USE THIS FILE AS SOURCE OF TRUTH. OpenClaw should inspect the live project files directly instead.

Generated from registered region scenes in C:\dev\bikebrowser on 2026-05-20.
This is a read-only convenience bundle. The canonical files remain the individual .tscn files in BikeBrowserWorld/Regions and the registry in BikeBrowserWorld/Data/regions/regions.json.

## Included Scenes
- boot: Boot -> BikeBrowserWorld\Regions\Boot\Boot.tscn
- neighborhood_street: Dusk Neighborhood -> BikeBrowserWorld\Regions\Neighborhood\NeighborhoodStreet.tscn
- garage: Zuzu's Garage -> BikeBrowserWorld\Regions\Garage\ZuzuGarage.tscn
- copper_mine: Copper Mine -> BikeBrowserWorld\Regions\Mine\CopperMine.tscn
- desert_trail: Desert Trail -> BikeBrowserWorld\Regions\Desert\DesertTrail.tscn
- salt_river: Salt River -> BikeBrowserWorld\Regions\River\SaltRiver.tscn
- dry_wash: Dry Wash Bridge -> BikeBrowserWorld\Regions\DryWash\DryWash.tscn
- system_showcase: Projects 1-20 Showcase -> BikeBrowserWorld\Regions\SystemShowcase\SystemShowcase.tscn

---

## boot - Boot

Source: `BikeBrowserWorld\Regions\Boot\Boot.tscn`

```gdscene
[gd_scene load_steps=2 format=3 uid="uid://bikebrowser_boot"]

[ext_resource type="Script" path="res://Regions/Boot/Boot.gd" id="1_boot"]

[node name="Boot" type="Control"]
layout_mode = 3
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
script = ExtResource("1_boot")

[node name="Center" type="CenterContainer" parent="."]
layout_mode = 1
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0

[node name="Panel" type="Panel" parent="Center"]
layout_mode = 2

[node name="VBox" type="VBoxContainer" parent="Center/Panel"]
layout_mode = 2
theme_override_constants/separation = 14

[node name="Title" type="Label" parent="Center/Panel/VBox"]
layout_mode = 2
text = "BikeBrowserWorld"
horizontal_alignment = 1

[node name="Subtitle" type="Label" parent="Center/Panel/VBox"]
layout_mode = 2
text = "A warm garage adventure at dusk"
horizontal_alignment = 1

[node name="AudioUnlockHint" type="Label" parent="Center/Panel/VBox"]
layout_mode = 2
text = "Press any key or click Start to wake the world"
horizontal_alignment = 1

[node name="StartButton" type="Button" parent="Center/Panel/VBox"]
layout_mode = 2
text = "Press Any Key To Start"

[node name="ContinueButton" type="Button" parent="Center/Panel/VBox"]
layout_mode = 2
text = "Continue"
```

---

## neighborhood_street - Dusk Neighborhood

Source: `BikeBrowserWorld\Regions\Neighborhood\NeighborhoodStreet.tscn`

```gdscene
[gd_scene load_steps=61 format=3 uid="uid://bikebrowser_neighborhood_street"]

[ext_resource type="Script" path="res://Systems/World/RegionScene.gd" id="1_region"]
[ext_resource type="Script" path="res://Systems/World/ZuzuController.gd" id="2_zuzu"]
[ext_resource type="Script" path="res://Systems/World/TransitionZone.gd" id="3_transition"]
[ext_resource type="PackedScene" path="res://Regions/NPCs/MrChenNpc.tscn" id="4_mrchen"]
[ext_resource type="PackedScene" path="res://Regions/UI/DialogBox.tscn" id="5_dialog"]
[ext_resource type="PackedScene" path="res://Regions/UI/Hud.tscn" id="6_hud"]
[ext_resource type="SpriteFrames" path="res://Assets/Characters/Zuzu/Zuzu.spriteframes.tres" id="7_zuzu_frames"]
[ext_resource type="PackedScene" path="res://Regions/NPCs/MrsRamirezNpc.tscn" id="8_mrs_ramirez"]
[ext_resource type="PackedScene" path="res://Regions/NPCs/OldMinerPeteNpc.tscn" id="9_old_miner"]
[ext_resource type="PackedScene" path="res://Regions/NPCs/RangerNitaNpc.tscn" id="10_ranger_nita"]
[ext_resource type="PackedScene" path="res://Regions/NPCs/DrMayaNpc.tscn" id="11_dr_maya"]
[ext_resource type="Texture2D" path="res://Assets/Props/Neighborhood/saguaro_cactus.png" id="12_saguaro"]
[ext_resource type="Texture2D" path="res://Assets/Props/Neighborhood/prickly_pear_cactus.png" id="13_prickly_pear"]
[ext_resource type="Texture2D" path="res://Assets/Props/Neighborhood/creosote_bush.png" id="14_creosote"]
[ext_resource type="Texture2D" path="res://Assets/Props/Neighborhood/desert_rock_cluster.png" id="15_rocks"]
[ext_resource type="Texture2D" path="res://Assets/Props/Neighborhood/wooden_fence_segment.png" id="16_fence"]
[ext_resource type="Texture2D" path="res://Assets/Props/Neighborhood/street_sign_desert_way.png" id="17_street_sign"]
[ext_resource type="Texture2D" path="res://Assets/Props/Neighborhood/suburban_mailbox.png" id="18_mailbox"]
[ext_resource type="Texture2D" path="res://Assets/Props/Neighborhood/fire_hydrant.png" id="19_hydrant"]
[ext_resource type="Texture2D" path="res://Assets/Props/Neighborhood/porch_light_glow.png" id="20_porch_light"]
[ext_resource type="Texture2D" path="res://Assets/Props/Neighborhood/chalk_hopscotch.png" id="21_chalk_hopscotch"]
[ext_resource type="Texture2D" path="res://Assets/Props/Neighborhood/chalk_smiling_sun.png" id="22_chalk_sun"]
[ext_resource type="Texture2D" path="res://Assets/Props/Garage/wooden_workbench_tools.png" id="23_workbench"]
[ext_resource type="Texture2D" path="res://Assets/Props/Neighborhood/bicycle_leaned_on_fence.png" id="24_bike_fence"]
[ext_resource type="Texture2D" path="res://Assets/Props/Neighborhood/street_lamp.png" id="25_street_lamp"]
[ext_resource type="Script" path="res://Regions/Neighborhood/NeighborhoodAmbience.gd" id="26_ambience"]
[ext_resource type="Script" path="res://Systems/Interactions/SafetyCheckStation.gd" id="27_safety"]
[ext_resource type="Script" path="res://Prototypes/EmbodiedMechanics/BrakeRig.gd" id="27_brake_rig"]
[ext_resource type="Texture2D" path="res://Assets/Props/Bike/small_safety_check_bike.png" id="28_safety_bike"]
[ext_resource type="Texture2D" path="res://Assets/Props/Bike/small_safety_check_bike_brakes_overlay.png" id="29_brake_overlay"]
[ext_resource type="Texture2D" path="res://Assets/Props/Bike/small_safety_check_bike_tires_overlay.png" id="30_tire_overlay"]
[ext_resource type="Texture2D" path="res://Assets/Props/Bike/small_safety_check_bike_chain_overlay.png" id="31_chain_overlay"]
[ext_resource type="Texture2D" path="res://Assets/Backgrounds/Derived/soft_shadow_small.png" id="32_shadow_small"]
[ext_resource type="Texture2D" path="res://Assets/Backgrounds/Derived/neighborhood_road_panel_v2.png" id="33_road_panel"]
[ext_resource type="Texture2D" path="res://Assets/Backgrounds/Derived/neighborhood_top_sidewalk_panel_v2.png" id="34_sidewalk_panel"]
[ext_resource type="Texture2D" path="res://Assets/Backgrounds/Derived/neighborhood_driveway_panel_v2.png" id="35_driveway_panel"]
[ext_resource type="Texture2D" path="res://Assets/Props/Bike/warm_repair_glint.png" id="36_glint"]
[ext_resource type="Texture2D" path="res://Assets/Backgrounds/Derived/soft_shadow_medium.png" id="37_shadow_medium"]
[ext_resource type="Texture2D" path="res://Assets/Backgrounds/Derived/neighborhood_dusk_mountains_panel.png" id="38_mountains"]
[ext_resource type="Texture2D" path="res://Assets/Backgrounds/Derived/neighborhood_yard_ground_panel_v2.png" id="39_yard_ground"]
[ext_resource type="Texture2D" path="res://Assets/Backgrounds/Derived/NeighborhoodFoundation/soft_road_shadow_overlay.png" id="40_road_shadow"]
[ext_resource type="Texture2D" path="res://Assets/Props/Neighborhood/Houses/zuzu_house_facade.png" id="41_zuzu_house"]
[ext_resource type="Texture2D" path="res://Assets/Props/Neighborhood/Houses/ramirez_house_facade.png" id="42_ramirez_house"]
[ext_resource type="Texture2D" path="res://Assets/Props/Neighborhood/Houses/chen_workshop_facade.png" id="43_workshop_house"]
[ext_resource type="Texture2D" path="res://Assets/Backgrounds/Derived/neighborhood_bottom_sidewalk_panel_v2.png" id="44_bottom_sidewalk"]
[ext_resource type="Texture2D" path="res://Assets/Backgrounds/Derived/NeighborhoodFoundation/curb_depth_integration_overlay.png" id="45_curb_depth"]
[ext_resource type="Texture2D" path="res://Assets/Backgrounds/Derived/NeighborhoodFoundation/house_grounding_integration_overlay.png" id="46_house_grounding"]
[ext_resource type="Texture2D" path="res://Assets/Backgrounds/Derived/NeighborhoodFoundation/prop_grounding_contact_overlay.png" id="47_prop_grounding"]
[ext_resource type="Texture2D" path="res://Assets/Backgrounds/Derived/NeighborhoodFoundation/warm_dusk_light_flow_overlay.png" id="48_light_flow"]
[ext_resource type="Script" path="res://Regions/Shared/SubtleAmbientLife.gd" id="49_ambient_life"]
[ext_resource type="Texture2D" path="res://Assets/Backgrounds/Derived/NeighborhoodFoundation/cinematic_focus_flow_overlay.png" id="50_cinematic_flow"]
[ext_resource type="Texture2D" path="res://Assets/Backgrounds/Derived/NeighborhoodFoundation/street_rhythm_composition_overlay.png" id="51_street_rhythm"]
[ext_resource type="Texture2D" path="res://Assets/Backgrounds/Derived/NeighborhoodFoundation/silhouette_readability_ground_overlay.png" id="52_silhouette_read"]
[ext_resource type="Script" path="res://Systems/Interactions/QuestObjectiveStation.gd" id="53_act1_station"]

[sub_resource type="CircleShape2D" id="CircleShape2D_player"]
radius = 18.0

[sub_resource type="RectangleShape2D" id="RectangleShape2D_garage"]
size = Vector2(120, 80)

[sub_resource type="RectangleShape2D" id="RectangleShape2D_edge"]
size = Vector2(96, 360)

[sub_resource type="RectangleShape2D" id="RectangleShape2D_safety"]
size = Vector2(150, 92)

[sub_resource type="RectangleShape2D" id="RectangleShape2D_act1_station"]
size = Vector2(170, 92)

[node name="NeighborhoodStreet" type="Node2D"]
script = ExtResource("1_region")
region_id = "neighborhood_street"
layout_path = "res://Data/layouts/neighborhood_street.json"

[node name="DuskDirectionalLight" type="DirectionalLight2D" parent="."]
rotation = -0.785398
color = Color(1, 0.647059, 0.34902, 1)
energy = 0.4

[node name="NeighborhoodAmbience" type="Node" parent="."]
script = ExtResource("26_ambience")

[node name="Background" type="Polygon2D" parent="."]
visible = false

[node name="MapFrame" type="Polygon2D" parent="."]
visible = false

[node name="TopGrass" type="Polygon2D" parent="."]
visible = false

[node name="BottomGrass" type="Polygon2D" parent="."]
visible = false

[node name="Road" type="Polygon2D" parent="."]
visible = false

[node name="TopSidewalk" type="Polygon2D" parent="."]
visible = false

[node name="BottomSidewalk" type="Polygon2D" parent="."]
visible = false

[node name="RoadLineA" type="Polygon2D" parent="."]
visible = false

[node name="RoadLineB" type="Polygon2D" parent="."]
visible = false

[node name="RoadLineC" type="Polygon2D" parent="."]
visible = false

[node name="RoadLineD" type="Polygon2D" parent="."]
visible = false

[node name="GroundArtLayer" type="Node2D" parent="."]
z_index = -5

[node name="DuskMountainsPanel" type="Sprite2D" parent="GroundArtLayer"]
texture_filter = 1
texture = ExtResource("38_mountains")

[node name="YardGroundPanel" type="Sprite2D" parent="GroundArtLayer"]
texture_filter = 1
texture = ExtResource("39_yard_ground")

[node name="RoadPanel" type="Sprite2D" parent="GroundArtLayer"]
texture_filter = 1
texture = ExtResource("33_road_panel")

[node name="TopSidewalkPanel" type="Sprite2D" parent="GroundArtLayer"]
texture_filter = 1
texture = ExtResource("34_sidewalk_panel")

[node name="BottomSidewalkPanel" type="Sprite2D" parent="GroundArtLayer"]
texture_filter = 1
texture = ExtResource("44_bottom_sidewalk")

[node name="RoadShadowOverlay" type="Sprite2D" parent="GroundArtLayer"]
texture_filter = 1
texture = ExtResource("40_road_shadow")

[node name="CurbDepthOverlay" type="Sprite2D" parent="GroundArtLayer"]
texture_filter = 1
texture = ExtResource("45_curb_depth")

[node name="GarageMarker" type="Polygon2D" parent="."]
visible = false

[node name="RamirezHouse" type="Polygon2D" parent="."]
visible = false

[node name="WorkshopHouse" type="Polygon2D" parent="."]
visible = false

[node name="ZuzuHouseRoof" type="Polygon2D" parent="."]
visible = false

[node name="RamirezHouseRoof" type="Polygon2D" parent="."]
visible = false

[node name="WorkshopHouseRoof" type="Polygon2D" parent="."]
visible = false

[node name="PorchGlow" type="Polygon2D" parent="."]
visible = false

[node name="SkyBand" type="Polygon2D" parent="."]
visible = false

[node name="Sidewalk" type="Polygon2D" parent="."]
visible = false

[node name="Driveway" type="Polygon2D" parent="."]
visible = false

[node name="DrivewayPanel" type="Sprite2D" parent="GroundArtLayer"]
texture_filter = 1
texture = ExtResource("35_driveway_panel")

[node name="HouseGroundingOverlay" type="Sprite2D" parent="GroundArtLayer"]
texture_filter = 1
texture = ExtResource("46_house_grounding")

[node name="PropGroundingOverlay" type="Sprite2D" parent="GroundArtLayer"]
texture_filter = 1
texture = ExtResource("47_prop_grounding")

[node name="WarmLightFlowOverlay" type="Sprite2D" parent="GroundArtLayer"]
texture_filter = 1
texture = ExtResource("48_light_flow")

[node name="StreetRhythmOverlay" type="Sprite2D" parent="GroundArtLayer"]
texture_filter = 1
texture = ExtResource("51_street_rhythm")

[node name="CinematicFocusFlowOverlay" type="Sprite2D" parent="GroundArtLayer"]
texture_filter = 1
texture = ExtResource("50_cinematic_flow")

[node name="SilhouetteReadabilityOverlay" type="Sprite2D" parent="GroundArtLayer"]
texture_filter = 1
texture = ExtResource("52_silhouette_read")

[node name="HouseLayer" type="Node2D" parent="."]
z_index = -1

[node name="ZuzuHouseFacade" type="Sprite2D" parent="HouseLayer"]
texture_filter = 1
texture = ExtResource("41_zuzu_house")

[node name="RamirezHouseFacade" type="Sprite2D" parent="HouseLayer"]
texture_filter = 1
texture = ExtResource("42_ramirez_house")

[node name="WorkshopHouseFacade" type="Sprite2D" parent="HouseLayer"]
texture_filter = 1
texture = ExtResource("43_workshop_house")

[node name="Fence" type="Node2D" parent="."]
visible = false

[node name="FenceRail" type="Polygon2D" parent="Fence"]
visible = false

[node name="FencePostA" type="Polygon2D" parent="Fence"]
visible = false

[node name="FencePostB" type="Polygon2D" parent="Fence"]
visible = false

[node name="FencePostC" type="Polygon2D" parent="Fence"]
visible = false

[node name="DesertPlants" type="Node2D" parent="."]
visible = false

[node name="CactusA" type="Polygon2D" parent="DesertPlants"]
visible = false

[node name="CactusArmA" type="Polygon2D" parent="DesertPlants"]
visible = false

[node name="CactusB" type="Polygon2D" parent="DesertPlants"]
visible = false

[node name="DesertRockA" type="Polygon2D" parent="DesertPlants"]
visible = false

[node name="DesertRockB" type="Polygon2D" parent="DesertPlants"]
visible = false

[node name="BikeRamp" type="Node2D" parent="."]

[node name="RampDeck" type="Polygon2D" parent="BikeRamp"]

[node name="RampSide" type="Polygon2D" parent="BikeRamp"]

[node name="TireTracks" type="Node2D" parent="."]

[node name="TrackA" type="Polygon2D" parent="TireTracks"]
visible = false

[node name="TrackB" type="Polygon2D" parent="TireTracks"]
visible = false

[node name="GroundPropLayer" type="Node2D" parent="."]

[node name="ChalkHopscotch" type="Sprite2D" parent="GroundPropLayer"]
texture_filter = 1
texture = ExtResource("21_chalk_hopscotch")

[node name="ChalkSun" type="Sprite2D" parent="GroundPropLayer"]
texture_filter = 1
texture = ExtResource("22_chalk_sun")

[node name="StoryGroundDetails" type="Node2D" parent="GroundPropLayer"]

[node name="ChalkBestJump" type="Label" parent="GroundPropLayer/StoryGroundDetails"]
modulate = Color(0.77, 0.88, 0.88, 0.68)
text = "BEST JUMP"
theme_override_font_sizes/font_size = 10

[node name="ChalkArrowToRamp" type="Polygon2D" parent="GroundPropLayer/StoryGroundDetails"]

[node name="ChalkSmudgeA" type="Polygon2D" parent="GroundPropLayer/StoryGroundDetails"]

[node name="ChalkSmudgeB" type="Polygon2D" parent="GroundPropLayer/StoryGroundDetails"]

[node name="TireScuffA" type="Polygon2D" parent="GroundPropLayer/StoryGroundDetails"]

[node name="TireScuffB" type="Polygon2D" parent="GroundPropLayer/StoryGroundDetails"]

[node name="CurbWearA" type="Polygon2D" parent="GroundPropLayer/StoryGroundDetails"]

[node name="CurbWearB" type="Polygon2D" parent="GroundPropLayer/StoryGroundDetails"]

[node name="WornPathToGarage" type="Polygon2D" parent="GroundPropLayer/StoryGroundDetails"]

[node name="HopscotchWornCorner" type="Polygon2D" parent="GroundPropLayer/StoryGroundDetails"]

[node name="JumpDistanceMarkA" type="Polygon2D" parent="GroundPropLayer/StoryGroundDetails"]

[node name="JumpDistanceMarkB" type="Polygon2D" parent="GroundPropLayer/StoryGroundDetails"]

[node name="JumpDistanceMarkC" type="Polygon2D" parent="GroundPropLayer/StoryGroundDetails"]

[node name="FadedPracticeArrow" type="Polygon2D" parent="GroundPropLayer/StoryGroundDetails"]

[node name="DustCurbBuildup" type="Polygon2D" parent="GroundPropLayer/StoryGroundDetails"]

[node name="OldSkidFeather" type="Polygon2D" parent="GroundPropLayer/StoryGroundDetails"]

[node name="LandmarkMemoryLayer" type="Node2D" parent="GroundPropLayer"]

[node name="GarageHomeAnchorGlow" type="Polygon2D" parent="GroundPropLayer/LandmarkMemoryLayer"]

[node name="RampMemoryArc" type="Polygon2D" parent="GroundPropLayer/LandmarkMemoryLayer"]

[node name="MailboxQuietAnchor" type="Polygon2D" parent="GroundPropLayer/LandmarkMemoryLayer"]

[node name="ChenWorkshopWarmPool" type="Polygon2D" parent="GroundPropLayer/LandmarkMemoryLayer"]

[node name="RamirezPorchCalmPool" type="Polygon2D" parent="GroundPropLayer/LandmarkMemoryLayer"]

[node name="QuietRoadBreathingBand" type="Polygon2D" parent="GroundPropLayer/LandmarkMemoryLayer"]

[node name="BehindPropLayer" type="Node2D" parent="."]

[node name="SaguaroCactusA" type="Sprite2D" parent="BehindPropLayer"]
texture_filter = 1
texture = ExtResource("12_saguaro")

[node name="SaguaroCactusB" type="Sprite2D" parent="BehindPropLayer"]
texture_filter = 1
texture = ExtResource("12_saguaro")

[node name="PorchLight" type="Sprite2D" parent="BehindPropLayer"]
texture_filter = 1
texture = ExtResource("20_porch_light")

[node name="StoryWarmWindows" type="Node2D" parent="BehindPropLayer"]

[node name="ZuzuWindowGlow" type="Polygon2D" parent="BehindPropLayer/StoryWarmWindows"]

[node name="RamirezWindowGlow" type="Polygon2D" parent="BehindPropLayer/StoryWarmWindows"]

[node name="WorkshopWindowGlow" type="Polygon2D" parent="BehindPropLayer/StoryWarmWindows"]

[node name="PorchLightPool" type="Polygon2D" parent="BehindPropLayer/StoryWarmWindows"]

[node name="PorchGlowMemoryRing" type="Polygon2D" parent="BehindPropLayer/StoryWarmWindows"]

[node name="MidPropLayer" type="Node2D" parent="."]
y_sort_enabled = true

[node name="PricklyPearA" type="Sprite2D" parent="MidPropLayer"]
texture_filter = 1
texture = ExtResource("13_prickly_pear")

[node name="PricklyPearB" type="Sprite2D" parent="MidPropLayer"]
texture_filter = 1
texture = ExtResource("13_prickly_pear")

[node name="PricklyPearC" type="Sprite2D" parent="MidPropLayer"]
texture_filter = 1
texture = ExtResource("13_prickly_pear")

[node name="CreosoteBushA" type="Sprite2D" parent="MidPropLayer"]
texture_filter = 1
texture = ExtResource("14_creosote")

[node name="CreosoteBushB" type="Sprite2D" parent="MidPropLayer"]
texture_filter = 1
texture = ExtResource("14_creosote")

[node name="DesertRockClusterA" type="Sprite2D" parent="MidPropLayer"]
texture_filter = 1
texture = ExtResource("15_rocks")

[node name="DesertRockClusterB" type="Sprite2D" parent="MidPropLayer"]
texture_filter = 1
texture = ExtResource("15_rocks")

[node name="StoryYardDetails" type="Node2D" parent="MidPropLayer"]
y_sort_enabled = true

[node name="AgavePlanterA" type="Polygon2D" parent="MidPropLayer/StoryYardDetails"]

[node name="AgavePlanterB" type="Polygon2D" parent="MidPropLayer/StoryYardDetails"]

[node name="OcotilloCanes" type="Polygon2D" parent="MidPropLayer/StoryYardDetails"]

[node name="ChollaPot" type="Polygon2D" parent="MidPropLayer/StoryYardDetails"]

[node name="DesertStoneBorderA" type="Polygon2D" parent="MidPropLayer/StoryYardDetails"]

[node name="DustPatchByMailbox" type="Polygon2D" parent="MidPropLayer/StoryYardDetails"]

[node name="DrySoilVariationA" type="Polygon2D" parent="MidPropLayer/StoryYardDetails"]

[node name="WarmRockEdgingA" type="Polygon2D" parent="MidPropLayer/StoryYardDetails"]

[node name="SunFadedPlanterEdge" type="Polygon2D" parent="MidPropLayer/StoryYardDetails"]

[node name="ForegroundPropLayer" type="Node2D" parent="."]
y_sort_enabled = true

[node name="FenceSegmentA" type="Sprite2D" parent="ForegroundPropLayer"]
texture_filter = 1
texture = ExtResource("16_fence")

[node name="FenceSegmentB" type="Sprite2D" parent="ForegroundPropLayer"]
texture_filter = 1
texture = ExtResource("16_fence")

[node name="FenceSegmentC" type="Sprite2D" parent="ForegroundPropLayer"]
texture_filter = 1
texture = ExtResource("16_fence")

[node name="FenceSegmentD" type="Sprite2D" parent="ForegroundPropLayer"]
texture_filter = 1
texture = ExtResource("16_fence")

[node name="FenceSegmentE" type="Sprite2D" parent="ForegroundPropLayer"]
texture_filter = 1
texture = ExtResource("16_fence")

[node name="StreetSign" type="Sprite2D" parent="ForegroundPropLayer"]
texture_filter = 1
texture = ExtResource("17_street_sign")

[node name="Mailbox" type="Sprite2D" parent="ForegroundPropLayer"]
texture_filter = 1
texture = ExtResource("18_mailbox")

[node name="FireHydrant" type="Sprite2D" parent="ForegroundPropLayer"]
texture_filter = 1
texture = ExtResource("19_hydrant")

[node name="StreetLampA" type="Sprite2D" parent="ForegroundPropLayer"]
texture_filter = 1
texture = ExtResource("25_street_lamp")

[node name="StreetLampB" type="Sprite2D" parent="ForegroundPropLayer"]
texture_filter = 1
texture = ExtResource("25_street_lamp")

[node name="BikeByFence" type="Sprite2D" parent="ForegroundPropLayer"]
texture_filter = 1
texture = ExtResource("24_bike_fence")

[node name="WorkbenchTools" type="Sprite2D" parent="ForegroundPropLayer"]
texture_filter = 1
texture = ExtResource("23_workbench")

[node name="StoryForegroundDetails" type="Node2D" parent="ForegroundPropLayer"]
y_sort_enabled = true

[node name="MailboxNameTape" type="Label" parent="ForegroundPropLayer/StoryForegroundDetails"]
modulate = Color(0.18, 0.16, 0.14, 0.8)
text = "RAMIREZ"
theme_override_font_sizes/font_size = 7
horizontal_alignment = 1

[node name="BentYardSign" type="Label" parent="ForegroundPropLayer/StoryForegroundDetails"]
modulate = Color(0.18, 0.14, 0.12, 0.82)
text = "Slow Bikes Please"
theme_override_font_sizes/font_size = 8
horizontal_alignment = 1

[node name="FenceMissingSlat" type="Polygon2D" parent="ForegroundPropLayer/StoryForegroundDetails"]

[node name="FencePatchBoard" type="Polygon2D" parent="ForegroundPropLayer/StoryForegroundDetails"]

[node name="BikePumpByFence" type="Polygon2D" parent="ForegroundPropLayer/StoryForegroundDetails"]

[node name="TinyBmxSticker" type="Polygon2D" parent="ForegroundPropLayer/StoryForegroundDetails"]

[node name="GarageThresholdMat" type="Label" parent="ForegroundPropLayer/StoryForegroundDetails"]
modulate = Color(0.95, 0.8, 0.55, 0.78)
text = "FIX IT"
theme_override_font_sizes/font_size = 9
horizontal_alignment = 1

[node name="BentReflector" type="Polygon2D" parent="ForegroundPropLayer/StoryForegroundDetails"]

[node name="StickerResidue" type="Polygon2D" parent="ForegroundPropLayer/StoryForegroundDetails"]

[node name="TireLeanDustSpot" type="Polygon2D" parent="ForegroundPropLayer/StoryForegroundDetails"]

[node name="SunFadedSignPatch" type="Polygon2D" parent="ForegroundPropLayer/StoryForegroundDetails"]

[node name="NeighborhoodAmbientLife" type="Node" parent="."]
script = ExtResource("49_ambient_life")
flicker_targets = [NodePath("../BehindPropLayer/StoryWarmWindows/ZuzuWindowGlow"), NodePath("../BehindPropLayer/StoryWarmWindows/RamirezWindowGlow"), NodePath("../BehindPropLayer/StoryWarmWindows/WorkshopWindowGlow"), NodePath("../BehindPropLayer/StoryWarmWindows/PorchLightPool")]
sway_targets = [NodePath("../ForegroundPropLayer/StoryForegroundDetails/BentYardSign"), NodePath("../MidPropLayer/StoryYardDetails/OcotilloCanes")]
flutter_targets = [NodePath("../GroundPropLayer/StoryGroundDetails/ChalkBestJump"), NodePath("../ForegroundPropLayer/StoryForegroundDetails/GarageThresholdMat")]
flicker_strength = 0.45
sway_strength = 0.35
flutter_strength = 0.35
speed_scale = 0.7

[node name="ZuzuHouseLabel" type="Label" parent="."]
visible = false
text = "Zuzu's House"
horizontal_alignment = 1

[node name="RamirezHouseLabel" type="Label" parent="."]
visible = false
text = "Ramirez House"
horizontal_alignment = 1

[node name="WorkshopLabel" type="Label" parent="."]
visible = false
text = "Workshop"
horizontal_alignment = 1

[node name="NeighborhoodLabel" type="Label" parent="."]
visible = false
text = "Neighborhood"
horizontal_alignment = 1

[node name="MrChenLabel" type="Label" parent="."]
visible = false
text = "Mr. Chen"
horizontal_alignment = 1

[node name="MrsRamirezLabel" type="Label" parent="."]
visible = false
text = "Mrs. Ramirez"
horizontal_alignment = 1

[node name="GarageEntrance" type="Area2D" parent="."]
script = ExtResource("3_transition")
target_region = "garage"
target_spawn = "from_neighborhood"
feedback_message = "Zuzu steps into the garage workshop."

[node name="CollisionShape2D" type="CollisionShape2D" parent="GarageEntrance"]
shape = SubResource("RectangleShape2D_garage")

[node name="Prompt" type="Label" parent="GarageEntrance"]
text = "[E] Garage"
horizontal_alignment = 1

[node name="Guide" type="Label" parent="GarageEntrance"]
modulate = Color(1, 0.94, 0.78, 0.86)
text = "Workshop"
horizontal_alignment = 1
theme_override_font_sizes/font_size = 12

[node name="MrChen" parent="." instance=ExtResource("4_mrchen")]

[node name="SoftShadow" type="Sprite2D" parent="MrChen"]
texture_filter = 1
texture = ExtResource("32_shadow_small")

[node name="MrsRamirezNpc" parent="." instance=ExtResource("8_mrs_ramirez")]

[node name="SoftShadow" type="Sprite2D" parent="MrsRamirezNpc"]
texture_filter = 1
texture = ExtResource("32_shadow_small")

[node name="SafetyCheckStation" type="Area2D" parent="."]
script = ExtResource("27_safety")

[node name="CollisionShape2D" type="CollisionShape2D" parent="SafetyCheckStation"]
shape = SubResource("RectangleShape2D_safety")

[node name="SoftShadow" type="Sprite2D" parent="SafetyCheckStation"]
texture_filter = 1
texture = ExtResource("37_shadow_medium")

[node name="Glow" type="Polygon2D" parent="SafetyCheckStation"]
polygon = PackedVector2Array(-70, -34, 70, -34, 84, 38, -84, 38)
color = Color(1, 0.756863, 0.337255, 0.25)

[node name="BikeVisual" type="Node2D" parent="SafetyCheckStation"]

[node name="SafetyBike" type="Sprite2D" parent="SafetyCheckStation/BikeVisual"]
texture_filter = 1
texture = ExtResource("28_safety_bike")

[node name="BrakeHighlight" type="Sprite2D" parent="SafetyCheckStation/BikeVisual"]
texture_filter = 1
texture = ExtResource("29_brake_overlay")

[node name="TireHighlight" type="Sprite2D" parent="SafetyCheckStation/BikeVisual"]
texture_filter = 1
texture = ExtResource("30_tire_overlay")

[node name="ChainHighlight" type="Sprite2D" parent="SafetyCheckStation/BikeVisual"]
texture_filter = 1
texture = ExtResource("31_chain_overlay")

[node name="BrakeRig" type="Node2D" parent="SafetyCheckStation/BikeVisual"]
visible = false
position = Vector2(-4, -2)
script = ExtResource("27_brake_rig")
wheel_path = NodePath("Wheel")
lever_path = NodePath("BrakeLever")
cable_path = NodePath("BrakeCable")
cable_slack_path = NodePath("CableSlack")
cable_pull_arrow_path = NodePath("CablePullArrow")
caliper_left_path = NodePath("CaliperLeft")
caliper_right_path = NodePath("CaliperRight")
pad_left_path = NodePath("CaliperLeft/PadLeft")
pad_right_path = NodePath("CaliperRight/PadRight")
contact_path = NodePath("ContactPoint")
contact_pinch_path = NodePath("ContactPinch")
compression_glow_path = NodePath("CompressionGlow")
friction_band_path = NodePath("FrictionBand")
force_path_path = NodePath("ForcePath")
lever_resistance_arc_path = NodePath("LeverResistanceArc")
cable_load_mark_path = NodePath("CableLoadMark")
spin_ghost_path = NodePath("Wheel/SpinGhost")

[node name="ForcePath" type="Line2D" parent="SafetyCheckStation/BikeVisual/BrakeRig"]
visible = false
points = PackedVector2Array(-58, -34, -32, -24, 12, -8, 36, 1, 42, 20)
width = 5.0
default_color = Color(1, 0.72, 0.36, 0.24)

[node name="Wheel" type="Node2D" parent="SafetyCheckStation/BikeVisual/BrakeRig"]
position = Vector2(42, 20)

[node name="SpinGhost" type="Line2D" parent="SafetyCheckStation/BikeVisual/BrakeRig/Wheel"]
points = PackedVector2Array(25, 0, 21.65, 12.5, 12.5, 21.65, 0, 25, -12.5, 21.65, -21.65, 12.5, -25, 0, -21.65, -12.5, -12.5, -21.65, 0, -25, 12.5, -21.65, 21.65, -12.5, 25, 0)
width = 5.0
default_color = Color(0.52, 0.76, 0.90, 0.20)

[node name="Rim" type="Line2D" parent="SafetyCheckStation/BikeVisual/BrakeRig/Wheel"]
points = PackedVector2Array(24, 0, 20.78, 12, 12, 20.78, 0, 24, -12, 20.78, -20.78, 12, -24, 0, -20.78, -12, -12, -20.78, 0, -24, 12, -20.78, 20.78, -12, 24, 0)
width = 3.5
default_color = Color(0.76, 0.82, 0.84, 1)

[node name="SpokeA" type="Line2D" parent="SafetyCheckStation/BikeVisual/BrakeRig/Wheel"]
points = PackedVector2Array(-21, 0, 21, 0)
width = 1.6
default_color = Color(0.48, 0.56, 0.60, 1)

[node name="SpokeB" type="Line2D" parent="SafetyCheckStation/BikeVisual/BrakeRig/Wheel"]
rotation = 1.5708
points = PackedVector2Array(-21, 0, 21, 0)
width = 1.6
default_color = Color(0.48, 0.56, 0.60, 1)

[node name="Rotor" type="Line2D" parent="SafetyCheckStation/BikeVisual/BrakeRig/Wheel"]
points = PackedVector2Array(11, 0, 9.53, 5.5, 5.5, 9.53, 0, 11, -5.5, 9.53, -9.53, 5.5, -11, 0, -9.53, -5.5, -5.5, -9.53, 0, -11, 5.5, -9.53, 9.53, -5.5, 11, 0)
width = 2.0
default_color = Color(0.93, 0.86, 0.72, 1)

[node name="BrakeLever" type="Line2D" parent="SafetyCheckStation/BikeVisual/BrakeRig"]
position = Vector2(-58, -34)
points = PackedVector2Array(0, 0, 24, 9)
width = 5.0
default_color = Color(0.88, 0.94, 0.92, 1)

[node name="LeverResistanceArc" type="Line2D" parent="SafetyCheckStation/BikeVisual/BrakeRig"]
visible = false
points = PackedVector2Array(-58, -34, -51, -27, -42, -23, -34, -23)
width = 3.0
default_color = Color(0.86, 0.95, 0.86, 0.22)

[node name="Handlebar" type="Line2D" parent="SafetyCheckStation/BikeVisual/BrakeRig"]
points = PackedVector2Array(-70, -36, -38, -36)
width = 4.0
default_color = Color(0.44, 0.56, 0.58, 1)

[node name="CableSlack" type="Line2D" parent="SafetyCheckStation/BikeVisual/BrakeRig"]
points = PackedVector2Array(-35, -25, -11, -8, 28, 0)
width = 2.4
default_color = Color(0.42, 0.50, 0.58, 0.44)

[node name="BrakeCable" type="Line2D" parent="SafetyCheckStation/BikeVisual/BrakeRig"]
points = PackedVector2Array(-35, -25, -8, -15, 28, 0)
width = 3.0
default_color = Color(0.62, 0.72, 0.86, 0.58)

[node name="CablePullArrow" type="Line2D" parent="SafetyCheckStation/BikeVisual/BrakeRig"]
visible = false
position = Vector2(-24, -17)
points = PackedVector2Array(0, 0, 10, 3, 7, -2, 10, 3, 4, 6)
width = 2.0
default_color = Color(1, 0.79, 0.42, 0.65)

[node name="CableLoadMark" type="Line2D" parent="SafetyCheckStation/BikeVisual/BrakeRig"]
visible = false
position = Vector2(2, -9)
points = PackedVector2Array(-8, -2, 8, 2)
width = 4.0
default_color = Color(0.84, 0.94, 1, 0.35)

[node name="CaliperBridge" type="Line2D" parent="SafetyCheckStation/BikeVisual/BrakeRig"]
points = PackedVector2Array(27, -1, 42, -6, 57, -1)
width = 3.0
default_color = Color(0.58, 0.66, 0.68, 1)

[node name="CaliperLeft" type="Line2D" parent="SafetyCheckStation/BikeVisual/BrakeRig"]
position = Vector2(27, -1)
points = PackedVector2Array(0, 0, 11, 21)
width = 4.0
default_color = Color(0.70, 0.76, 0.78, 1)

[node name="PadLeft" type="ColorRect" parent="SafetyCheckStation/BikeVisual/BrakeRig/CaliperLeft"]
offset_left = 8.0
offset_top = 17.0
offset_right = 17.0
offset_bottom = 23.0
color = Color(0.13, 0.14, 0.13, 1)

[node name="CaliperRight" type="Line2D" parent="SafetyCheckStation/BikeVisual/BrakeRig"]
position = Vector2(57, -1)
points = PackedVector2Array(0, 0, -11, 21)
width = 4.0
default_color = Color(0.70, 0.76, 0.78, 1)

[node name="PadRight" type="ColorRect" parent="SafetyCheckStation/BikeVisual/BrakeRig/CaliperRight"]
offset_left = -17.0
offset_top = 17.0
offset_right = -8.0
offset_bottom = 23.0
color = Color(0.13, 0.14, 0.13, 1)

[node name="ContactPoint" type="ColorRect" parent="SafetyCheckStation/BikeVisual/BrakeRig"]
visible = false
offset_left = 36.0
offset_top = 17.0
offset_right = 48.0
offset_bottom = 22.0
color = Color(1, 0.78, 0.42, 0.4)

[node name="ContactPinch" type="Line2D" parent="SafetyCheckStation/BikeVisual/BrakeRig"]
visible = false
points = PackedVector2Array(29, 13, 38, 20, 46, 20, 55, 13)
width = 3.2
default_color = Color(0.96, 0.84, 0.58, 0.38)

[node name="CompressionGlow" type="ColorRect" parent="SafetyCheckStation/BikeVisual/BrakeRig"]
visible = false
offset_left = 31.0
offset_top = 11.0
offset_right = 53.0
offset_bottom = 27.0
color = Color(1, 0.72, 0.34, 0.18)

[node name="FrictionBand" type="Line2D" parent="SafetyCheckStation/BikeVisual/BrakeRig"]
visible = false
position = Vector2(42, 20)
points = PackedVector2Array(18, 0, 15.59, 9, 9, 15.59, 0, 18, -9, 15.59, -15.59, 9, -18, 0, -15.59, -9, -9, -15.59, 0, -18, 9, -15.59, 15.59, -9, 18, 0)
width = 4.0
default_color = Color(0.92, 0.70, 0.42, 0.18)

[node name="Frame" type="Polygon2D" parent="SafetyCheckStation/BikeVisual"]
visible = false
polygon = PackedVector2Array(-38, 12, -10, -22, 22, 12, -38, 12, 22, 12, 44, -18)
color = Color(0.172549, 0.392157, 0.741176, 1)

[node name="Wheel" type="Node2D" parent="SafetyCheckStation/BikeVisual"]

[node name="WheelA" type="Polygon2D" parent="SafetyCheckStation/BikeVisual/Wheel"]
visible = false
position = Vector2(-42, 18)
polygon = PackedVector2Array(-20, -20, 20, -20, 20, 20, -20, 20)
color = Color(0.0470588, 0.0588235, 0.0705882, 1)

[node name="WheelB" type="Polygon2D" parent="SafetyCheckStation/BikeVisual/Wheel"]
visible = false
position = Vector2(34, 18)
polygon = PackedVector2Array(-20, -20, 20, -20, 20, 20, -20, 20)
color = Color(0.0470588, 0.0588235, 0.0705882, 1)

[node name="Brake" type="Polygon2D" parent="SafetyCheckStation/BikeVisual"]
visible = false
position = Vector2(-42, -10)
polygon = PackedVector2Array(-22, -5, 22, -5, 22, 5, -22, 5)
color = Color(0.956863, 0.54902, 0.278431, 1)

[node name="Chain" type="Polygon2D" parent="SafetyCheckStation/BikeVisual"]
visible = false
position = Vector2(-4, 14)
polygon = PackedVector2Array(-24, -5, 24, -5, 24, 5, -24, 5)
color = Color(0.172549, 0.211765, 0.239216, 1)

[node name="Prompt" type="Label" parent="SafetyCheckStation"]
text = "[E] Safety Check"
horizontal_alignment = 1

[node name="MineExit" type="Area2D" parent="."]
script = ExtResource("3_transition")
target_region = "copper_mine"
target_spawn = "from_neighborhood"
require_accept = false
feedback_message = "Zuzu rides toward the copper mine."
locked_feedback = "Maybe after the bike is road-ready."
required_quest_id = "chain_repair"

[node name="CollisionShape2D" type="CollisionShape2D" parent="MineExit"]
shape = SubResource("RectangleShape2D_edge")

[node name="Prompt" type="Label" parent="MineExit"]
text = "Copper Mine"
horizontal_alignment = 1

[node name="Guide" type="Label" parent="MineExit"]
modulate = Color(1, 0.94, 0.78, 0.86)
text = "Ride to Copper Mine"
horizontal_alignment = 1
theme_override_font_sizes/font_size = 12

[node name="DesertExit" type="Area2D" parent="."]
script = ExtResource("3_transition")
target_region = "desert_trail"
target_spawn = "from_neighborhood"
require_accept = false
feedback_message = "Zuzu follows the desert trail."
locked_feedback = "The desert can wait until the chain runs smooth."
required_quest_id = "chain_repair"

[node name="CollisionShape2D" type="CollisionShape2D" parent="DesertExit"]
shape = SubResource("RectangleShape2D_edge")

[node name="Prompt" type="Label" parent="DesertExit"]
text = "Desert Trail"
horizontal_alignment = 1

[node name="Guide" type="Label" parent="DesertExit"]
modulate = Color(1, 0.94, 0.78, 0.86)
text = "Ride to Desert Trail"
horizontal_alignment = 1
theme_override_font_sizes/font_size = 12

[node name="RiverExit" type="Area2D" parent="."]
script = ExtResource("3_transition")
target_region = "salt_river"
target_spawn = "from_neighborhood"
require_accept = false
feedback_message = "Zuzu coasts toward the Salt River."
locked_feedback = "Check the bike first, then the river path opens."
required_quest_id = "chain_repair"

[node name="CollisionShape2D" type="CollisionShape2D" parent="RiverExit"]
shape = SubResource("RectangleShape2D_edge")

[node name="Prompt" type="Label" parent="RiverExit"]
text = "Salt River"
horizontal_alignment = 1

[node name="Guide" type="Label" parent="RiverExit"]
modulate = Color(1, 0.94, 0.78, 0.86)
text = "Ride to Salt River"
horizontal_alignment = 1
theme_override_font_sizes/font_size = 12

[node name="DryWashExit" type="Area2D" parent="."]
script = ExtResource("3_transition")
target_region = "dry_wash"
target_spawn = "from_neighborhood"
require_accept = false
feedback_message = "Zuzu rides to the dry wash bridge site."
locked_feedback = "The bridge site opens after the chain runs smooth."
required_quest_id = "chain_repair"

[node name="CollisionShape2D" type="CollisionShape2D" parent="DryWashExit"]
shape = SubResource("RectangleShape2D_act1_station")

[node name="Prompt" type="Label" parent="DryWashExit"]
text = "Dry Wash"
horizontal_alignment = 1

[node name="Guide" type="Label" parent="DryWashExit"]
modulate = Color(1, 0.94, 0.78, 0.86)
text = "Ride to Dry Wash"
horizontal_alignment = 1
theme_override_font_sizes/font_size = 12

[node name="ChainHotspotMarker" type="Polygon2D" parent="."]
visible = false

[node name="GarageGlint" type="Sprite2D" parent="."]
texture_filter = 1
texture = ExtResource("36_glint")

[node name="BridgeReviewStation" type="Area2D" parent="."]
script = ExtResource("53_act1_station")
quest_id = "bridge_quest_5"
objective_ids = Array[String](["talk_to_neighbors", "receive_badge", "unlock_new_area", "learn_triangles"])
prompt_text = "Bridge Review"
locked_prompt_text = "Road-ready first"
locked_sign_text = "Bridge Review"
completion_message = "Neighbors trace the triangle braces with Zuzu before the bridge opens wider paths."
completion_tone = "warm"

[node name="CollisionShape2D" type="CollisionShape2D" parent="BridgeReviewStation"]
shape = SubResource("RectangleShape2D_act1_station")

[node name="StationMat" type="Polygon2D" parent="BridgeReviewStation"]

[node name="Beacon" type="Polygon2D" parent="BridgeReviewStation"]

[node name="Sign" type="Label" parent="BridgeReviewStation"]
modulate = Color(1, 0.94, 0.78, 0.92)
text = "Bridge Review"
horizontal_alignment = 1
theme_override_font_sizes/font_size = 12

[node name="Prompt" type="Label" parent="BridgeReviewStation"]
text = "Bridge Review"
horizontal_alignment = 1

[node name="Act1CapstoneStation" type="Area2D" parent="."]
script = ExtResource("53_act1_station")
quest_id = "act1_regional_readiness"
objective_ids = Array[String](["review_bike_systems", "review_bridge_systems", "review_ecology_water", "review_materials_workshop", "sketch_regional_questions", "receive_spacecraft_clue"])
prompt_text = "Act 1 Review"
locked_prompt_text = "Finish field notes"
locked_sign_text = "Act 1 Review"
completion_message = "Mr. Chen helps Zuzu connect the local repairs, field notes, water evidence, and workshop parts into a wider travel plan."
completion_tone = "celebrate"
audio_cue = "soft_reward"

[node name="CollisionShape2D" type="CollisionShape2D" parent="Act1CapstoneStation"]
shape = SubResource("RectangleShape2D_act1_station")

[node name="StationMat" type="Polygon2D" parent="Act1CapstoneStation"]

[node name="Beacon" type="Polygon2D" parent="Act1CapstoneStation"]

[node name="Sign" type="Label" parent="Act1CapstoneStation"]
modulate = Color(1, 0.94, 0.78, 0.92)
text = "Act 1 Review"
horizontal_alignment = 1
theme_override_font_sizes/font_size = 12

[node name="Prompt" type="Label" parent="Act1CapstoneStation"]
text = "Act 1 Review"
horizontal_alignment = 1

[node name="Player" type="CharacterBody2D" parent="."]
script = ExtResource("2_zuzu")

[node name="Sprite" type="AnimatedSprite2D" parent="Player"]
texture_filter = 1
position = Vector2(0, -32)
scale = Vector2(1.15, 1.15)
sprite_frames = ExtResource("7_zuzu_frames")
animation = &"idle_down"

[node name="Shadow" type="Polygon2D" parent="Player"]
visible = false
polygon = PackedVector2Array(-30, 10, 30, 10, 24, 22, -24, 22)
color = Color(0, 0, 0, 0.22)

[node name="SoftShadow" type="Sprite2D" parent="Player"]
texture_filter = 1
texture = ExtResource("32_shadow_small")

[node name="CollisionShape2D" type="CollisionShape2D" parent="Player"]
shape = SubResource("CircleShape2D_player")

[node name="Body" type="Polygon2D" parent="Player"]
visible = false
polygon = PackedVector2Array(-13, -16, 13, -16, 16, 18, -16, 18)
color = Color(0.0862745, 0.560784, 0.792157, 1)

[node name="Head" type="Polygon2D" parent="Player"]
visible = false
position = Vector2(0, -30)
polygon = PackedVector2Array(-13, -11, 13, -11, 15, 9, 0, 16, -15, 9)
color = Color(0.854902, 0.564706, 0.364706, 1)

[node name="Cap" type="Polygon2D" parent="Player"]
visible = false
position = Vector2(0, -43)
polygon = PackedVector2Array(-16, 4, -8, -8, 10, -8, 18, 3, 6, 9, -8, 8)
color = Color(0.956863, 0.376471, 0.235294, 1)

[node name="Backpack" type="Polygon2D" parent="Player"]
visible = false
position = Vector2(-15, 0)
polygon = PackedVector2Array(-5, -12, 5, -10, 5, 13, -7, 12)
color = Color(0.192157, 0.215686, 0.337255, 1)

[node name="Camera2D" type="Camera2D" parent="Player"]
enabled = true
process_callback = 0
position_smoothing_enabled = true

[node name="DialogBox" parent="." instance=ExtResource("5_dialog")]

[node name="Hud" parent="." instance=ExtResource("6_hud")]
```

---

## garage - Zuzu's Garage

Source: `BikeBrowserWorld\Regions\Garage\ZuzuGarage.tscn`

```gdscene
[gd_scene load_steps=66 format=3 uid="uid://bikebrowser_zuzu_garage"]

[ext_resource type="Script" path="res://Systems/World/RegionScene.gd" id="1_region"]
[ext_resource type="Script" path="res://Systems/World/ZuzuController.gd" id="2_zuzu"]
[ext_resource type="Script" path="res://Systems/World/TransitionZone.gd" id="3_transition"]
[ext_resource type="Script" path="res://Systems/Interactions/ChainHotspot.gd" id="4_chain"]
[ext_resource type="PackedScene" path="res://Prototypes/EmbodiedMechanics/ChainRigEmbedded.tscn" id="4b_chainrig"]
[ext_resource type="PackedScene" path="res://Regions/UI/DialogBox.tscn" id="5_dialog"]
[ext_resource type="PackedScene" path="res://Regions/UI/Hud.tscn" id="6_hud"]
[ext_resource type="PackedScene" path="res://Regions/Garage/TireRepairStation.tscn" id="7_tire"]
[ext_resource type="Texture2D" path="res://Assets/Environment/GarageKit/garage_floor.svg" id="8_floor"]
[ext_resource type="Texture2D" path="res://Assets/Environment/GarageKit/garage_walls.svg" id="9_walls"]
[ext_resource type="Texture2D" path="res://Assets/Environment/GarageKit/workbench.svg" id="10_workbench"]
[ext_resource type="Texture2D" path="res://Assets/Environment/GarageKit/pegboard.svg" id="11_pegboard"]
[ext_resource type="Texture2D" path="res://Assets/Environment/GarageKit/rug.svg" id="12_rug"]
[ext_resource type="Texture2D" path="res://Assets/Environment/GarageKit/bike_stand.svg" id="13_bike"]
[ext_resource type="Texture2D" path="res://Assets/Environment/GarageKit/lamp_glow.svg" id="14_glow"]
[ext_resource type="SpriteFrames" path="res://Assets/Characters/Zuzu/Zuzu.spriteframes.tres" id="15_zuzu_frames"]
[ext_resource type="PackedScene" path="res://Regions/NPCs/ZevonNpc.tscn" id="16_zevon"]
[ext_resource type="PackedScene" path="res://Regions/NPCs/JacobNpc.tscn" id="17_jacob"]
[ext_resource type="PackedScene" path="res://Regions/NPCs/CharlieNpc.tscn" id="18_charlie"]
[ext_resource type="PackedScene" path="res://Regions/NPCs/ColeNpc.tscn" id="19_cole"]
[ext_resource type="PackedScene" path="res://Regions/NPCs/JamesNpc.tscn" id="20_james"]
[ext_resource type="Texture2D" path="res://Assets/Props/Garage/wooden_workbench_tools.png" id="21_workbench_png"]
[ext_resource type="Texture2D" path="res://Assets/Props/Garage/pegboard_tool_rack.png" id="22_pegboard_png"]
[ext_resource type="Texture2D" path="res://Assets/Props/Garage/stacked_tires.png" id="23_tires_png"]
[ext_resource type="Texture2D" path="res://Assets/Props/Garage/metal_oil_can.png" id="24_oil_can"]
[ext_resource type="Texture2D" path="res://Assets/Props/Garage/bike_repair_stand.png" id="25_repair_stand"]
[ext_resource type="Texture2D" path="res://Assets/Props/Garage/z_emblem_floor_rug.png" id="26_rug_png"]
[ext_resource type="Texture2D" path="res://Assets/Props/Garage/metal_toolbox.png" id="27_toolbox"]
[ext_resource type="Texture2D" path="res://Assets/Props/Garage/paint_can_wall_shelf.png" id="28_paint_shelf"]
[ext_resource type="Texture2D" path="res://Assets/Props/Garage/hanging_string_lights.png" id="29_string_lights"]
[ext_resource type="Texture2D" path="res://Assets/Props/Garage/keep_pedaling_poster.png" id="30_poster"]
[ext_resource type="Texture2D" path="res://Assets/Props/Repair/loose_bike_chain.png" id="31_chain_png"]
[ext_resource type="Texture2D" path="res://Assets/Props/Repair/bike_wheel.png" id="32_wheel_png"]
[ext_resource type="Texture2D" path="res://Assets/Props/Repair/inner_tube.png" id="33_tube_png"]
[ext_resource type="Texture2D" path="res://Assets/Props/Repair/floor_air_pump.png" id="34_pump_png"]
[ext_resource type="Texture2D" path="res://Assets/Props/Repair/tire_patch_kit.png" id="35_patch_kit"]
[ext_resource type="Script" path="res://Regions/Garage/GarageAmbience.gd" id="36_ambience"]
[ext_resource type="Texture2D" path="res://Assets/Props/Bike/garage_repair_stand_bmx_slipped_chain.png" id="37_repair_slipped"]
[ext_resource type="Texture2D" path="res://Assets/Backgrounds/Derived/garage_floor_panel.png" id="38_floor_panel"]
[ext_resource type="Texture2D" path="res://Assets/Backgrounds/Derived/garage_wall_panel.png" id="39_wall_panel"]
[ext_resource type="Texture2D" path="res://Assets/Backgrounds/Derived/soft_shadow_large.png" id="40_shadow_large"]
[ext_resource type="Texture2D" path="res://Assets/Backgrounds/Derived/soft_shadow_small.png" id="41_shadow_small"]
[ext_resource type="Texture2D" path="res://Assets/Props/Bike/warm_repair_glint.png" id="42_glint"]
[ext_resource type="Texture2D" path="res://Assets/Props/Bike/garage_repair_stand_bmx_aligning_chain.png" id="43_repair_aligned"]
[ext_resource type="Texture2D" path="res://Assets/Props/Bike/garage_repair_stand_bmx_seated_chain.png" id="44_repair_seated"]
[ext_resource type="Texture2D" path="res://Assets/Props/Garage/rear_derailleur_closeup.png" id="45_derailleur"]
[ext_resource type="Texture2D" path="res://Assets/Props/Garage/cassette_gear_cluster.png" id="46_cassette"]
[ext_resource type="Texture2D" path="res://Assets/Props/Garage/chain_lube_bottle.png" id="47_chain_lube"]
[ext_resource type="Texture2D" path="res://Assets/Props/Garage/multi_tool.png" id="48_multi_tool"]
[ext_resource type="Texture2D" path="res://Assets/Props/Garage/parts_bin.png" id="49_parts_bin"]
[ext_resource type="Texture2D" path="res://Assets/Props/Garage/oil_stain_floor.png" id="50_oil_stain"]
[ext_resource type="Texture2D" path="res://Assets/Props/Garage/hex_key_set.png" id="51_hex_keys"]
[ext_resource type="Texture2D" path="res://Assets/Props/BikeRepair/chain_breaker_tool.png" id="52_chain_breaker"]
[ext_resource type="Texture2D" path="res://Assets/Props/BikeRepair/tire_lever_set.png" id="53_tire_levers"]
[ext_resource type="Texture2D" path="res://Assets/Props/BikeRepair/patch_with_glue_tube.png" id="54_patch_glue"]
[ext_resource type="Script" path="res://Regions/Shared/SubtleAmbientLife.gd" id="55_ambient_life"]
[ext_resource type="Texture2D" path="res://Assets/Props/Bike/repair_chain_focus_glow.png" id="56_chain_focus"]
[ext_resource type="Texture2D" path="res://Assets/Props/Bike/repair_grease_scuff_detail.png" id="57_grease_scuff"]
[ext_resource type="Script" path="res://Systems/Interactions/QuestObjectiveStation.gd" id="58_act1_station"]
[ext_resource type="PackedScene" path="res://Regions/NPCs/MrChenNpc.tscn" id="59_mrchen"]

[sub_resource type="CircleShape2D" id="CircleShape2D_player"]
radius = 18.0

[sub_resource type="RectangleShape2D" id="RectangleShape2D_zone"]
size = Vector2(120, 80)

[sub_resource type="RectangleShape2D" id="RectangleShape2D_workshop_station"]
size = Vector2(180, 92)

[sub_resource type="Gradient" id="Gradient_warm_light"]
offsets = PackedFloat32Array(0, 1)
colors = PackedColorArray(1, 1, 1, 0.82, 1, 1, 1, 0)

[sub_resource type="GradientTexture2D" id="GradientTexture2D_warm_light"]
gradient = SubResource("Gradient_warm_light")
width = 256
height = 256
fill = 1
fill_from = Vector2(0.5, 0.5)
fill_to = Vector2(1, 0.5)

[node name="ZuzuGarage" type="Node2D"]
script = ExtResource("1_region")
region_id = "garage"
layout_path = "res://Data/layouts/garage.json"

[node name="GarageAmbience" type="Node" parent="."]
script = ExtResource("36_ambience")

[node name="FloorLayer" type="Node2D" parent="."]

[node name="FloorTiles" type="TileMapLayer" parent="FloorLayer"]

[node name="GarageFloorArt" type="Sprite2D" parent="FloorLayer"]
texture_filter = 1
texture = ExtResource("38_floor_panel")

[node name="WallLayer" type="Node2D" parent="."]

[node name="GarageWallsArt" type="Sprite2D" parent="WallLayer"]
texture_filter = 1
texture = ExtResource("39_wall_panel")

[node name="ShadowLayer" type="Node2D" parent="."]

[node name="StoryFloorDetails" type="Node2D" parent="ShadowLayer"]

[node name="WorkbenchGroundShadow" type="Polygon2D" parent="ShadowLayer/StoryFloorDetails"]

[node name="RepairStandGroundShadow" type="Polygon2D" parent="ShadowLayer/StoryFloorDetails"]

[node name="GreaseSmudgeA" type="Polygon2D" parent="ShadowLayer/StoryFloorDetails"]

[node name="GreaseSmudgeB" type="Polygon2D" parent="ShadowLayer/StoryFloorDetails"]

[node name="ChainLinkTrailA" type="Polygon2D" parent="ShadowLayer/StoryFloorDetails"]

[node name="ChainLinkTrailB" type="Polygon2D" parent="ShadowLayer/StoryFloorDetails"]

[node name="WornPathToBench" type="Polygon2D" parent="ShadowLayer/StoryFloorDetails"]

[node name="ThresholdWearSoft" type="Polygon2D" parent="ShadowLayer/StoryFloorDetails"]

[node name="CoffeeMugRing" type="Polygon2D" parent="ShadowLayer/StoryFloorDetails"]

[node name="OldTapeResidueA" type="Polygon2D" parent="ShadowLayer/StoryFloorDetails"]

[node name="BenchScratchA" type="Polygon2D" parent="ShadowLayer/StoryFloorDetails"]

[node name="HandprintGreaseSmear" type="Polygon2D" parent="ShadowLayer/StoryFloorDetails"]

[node name="HomeMemoryLayer" type="Node2D" parent="ShadowLayer"]

[node name="RepairHomeWarmPool" type="Polygon2D" parent="ShadowLayer/HomeMemoryLayer"]

[node name="BenchMemoryPool" type="Polygon2D" parent="ShadowLayer/HomeMemoryLayer"]

[node name="QuietFloorRestBand" type="Polygon2D" parent="ShadowLayer/HomeMemoryLayer"]

[node name="PropLayer" type="Node2D" parent="."]
y_sort_enabled = true

[node name="WorkbenchArt" type="Sprite2D" parent="PropLayer"]
visible = false
texture = ExtResource("10_workbench")

[node name="PegboardArt" type="Sprite2D" parent="PropLayer"]
visible = false
texture = ExtResource("11_pegboard")

[node name="RugArt" type="Sprite2D" parent="PropLayer"]
visible = false
texture = ExtResource("12_rug")

[node name="BikeStandArt" type="Sprite2D" parent="PropLayer"]
visible = false
texture = ExtResource("13_bike")

[node name="RugProp" type="Sprite2D" parent="PropLayer"]
texture_filter = 1
texture = ExtResource("26_rug_png")

[node name="WorkbenchProp" type="Sprite2D" parent="PropLayer"]
texture_filter = 1
texture = ExtResource("21_workbench_png")

[node name="PegboardProp" type="Sprite2D" parent="PropLayer"]
texture_filter = 1
texture = ExtResource("22_pegboard_png")

[node name="TireStackProp" type="Sprite2D" parent="PropLayer"]
texture_filter = 1
texture = ExtResource("23_tires_png")

[node name="OilCanProp" type="Sprite2D" parent="PropLayer"]
texture_filter = 1
texture = ExtResource("24_oil_can")

[node name="BikeRepairStandProp" type="Sprite2D" parent="PropLayer"]
visible = false
texture_filter = 1
texture = ExtResource("25_repair_stand")

[node name="ToolboxProp" type="Sprite2D" parent="PropLayer"]
texture_filter = 1
texture = ExtResource("27_toolbox")

[node name="PaintShelfProp" type="Sprite2D" parent="PropLayer"]
texture_filter = 1
texture = ExtResource("28_paint_shelf")

[node name="KeepPedalingPosterProp" type="Sprite2D" parent="PropLayer"]
texture_filter = 1
texture = ExtResource("30_poster")

[node name="BikeWheelWallProp" type="Sprite2D" parent="PropLayer"]
texture_filter = 1
texture = ExtResource("32_wheel_png")

[node name="StoryWorkbenchDetails" type="Node2D" parent="PropLayer"]
y_sort_enabled = true

[node name="CoffeeMug" type="Polygon2D" parent="PropLayer/StoryWorkbenchDetails"]

[node name="TapeRoll" type="Polygon2D" parent="PropLayer/StoryWorkbenchDetails"]

[node name="SpareTubeBox" type="Label" parent="PropLayer/StoryWorkbenchDetails"]
modulate = Color(0.19, 0.12, 0.09, 0.86)
text = "TUBE"
theme_override_font_sizes/font_size = 8
horizontal_alignment = 1

[node name="OpenNotebook" type="Label" parent="PropLayer/StoryWorkbenchDetails"]
modulate = Color(0.16, 0.13, 0.1, 0.82)
text = "chain\\nnotes"
theme_override_font_sizes/font_size = 7
horizontal_alignment = 1

[node name="KidBikeSketch" type="Label" parent="PropLayer/StoryWorkbenchDetails"]
modulate = Color(0.18, 0.16, 0.14, 0.78)
text = "jump idea"
theme_override_font_sizes/font_size = 7
horizontal_alignment = 1

[node name="OldRaceNumber" type="Label" parent="PropLayer/StoryWorkbenchDetails"]
modulate = Color(0.12, 0.1, 0.09, 0.88)
text = "#27"
theme_override_font_sizes/font_size = 13
horizontal_alignment = 1

[node name="BmxStickerLightning" type="Polygon2D" parent="PropLayer/StoryWorkbenchDetails"]

[node name="TapedChecklist" type="Label" parent="PropLayer/StoryWorkbenchDetails"]
modulate = Color(0.18, 0.14, 0.1, 0.86)
text = "brakes\\ntires\\nchain"
theme_override_font_sizes/font_size = 7

[node name="HangingHexKeys" type="Polygon2D" parent="PropLayer/StoryWorkbenchDetails"]

[node name="ToolboxWearPatch" type="Polygon2D" parent="PropLayer/StoryWorkbenchDetails"]

[node name="SecondStickerLayer" type="Polygon2D" parent="PropLayer/StoryWorkbenchDetails"]

[node name="RaceNumberTapeResidue" type="Polygon2D" parent="PropLayer/StoryWorkbenchDetails"]

[node name="TinyFoldedRepairNote" type="Label" parent="PropLayer/StoryWorkbenchDetails"]
modulate = Color(0.18, 0.14, 0.1, 0.78)
text = "try again"
theme_override_font_sizes/font_size = 7
horizontal_alignment = 1

[node name="WorkbenchCohesionDetails" type="Node2D" parent="PropLayer"]
y_sort_enabled = true

[node name="RearDerailleurCloseup" type="Sprite2D" parent="PropLayer/WorkbenchCohesionDetails"]
texture_filter = 1
texture = ExtResource("45_derailleur")

[node name="CassetteGearCluster" type="Sprite2D" parent="PropLayer/WorkbenchCohesionDetails"]
texture_filter = 1
texture = ExtResource("46_cassette")

[node name="ChainLubeBottle" type="Sprite2D" parent="PropLayer/WorkbenchCohesionDetails"]
texture_filter = 1
texture = ExtResource("47_chain_lube")

[node name="MultiTool" type="Sprite2D" parent="PropLayer/WorkbenchCohesionDetails"]
texture_filter = 1
texture = ExtResource("48_multi_tool")

[node name="PartsBin" type="Sprite2D" parent="PropLayer/WorkbenchCohesionDetails"]
texture_filter = 1
texture = ExtResource("49_parts_bin")

[node name="HexKeySet" type="Sprite2D" parent="PropLayer/WorkbenchCohesionDetails"]
texture_filter = 1
texture = ExtResource("51_hex_keys")

[node name="ChainBreakerTool" type="Sprite2D" parent="PropLayer/WorkbenchCohesionDetails"]
texture_filter = 1
texture = ExtResource("52_chain_breaker")

[node name="TireLeverSet" type="Sprite2D" parent="PropLayer/WorkbenchCohesionDetails"]
texture_filter = 1
texture = ExtResource("53_tire_levers")

[node name="PatchWithGlueTube" type="Sprite2D" parent="PropLayer/WorkbenchCohesionDetails"]
texture_filter = 1
texture = ExtResource("54_patch_glue")

[node name="FloorCohesionDetails" type="Node2D" parent="PropLayer"]
y_sort_enabled = true

[node name="OilStainNearStand" type="Sprite2D" parent="PropLayer/FloorCohesionDetails"]
texture_filter = 1
texture = ExtResource("50_oil_stain")

[node name="RepairGreaseScuff" type="Sprite2D" parent="PropLayer/FloorCohesionDetails"]
texture_filter = 1
texture = ExtResource("57_grease_scuff")

[node name="InteractableLayer" type="Node2D" parent="."]
y_sort_enabled = true

[node name="LooseChainProp" type="Sprite2D" parent="InteractableLayer"]
visible = false
texture_filter = 1
texture = ExtResource("31_chain_png")

[node name="BikeWheelRepairProp" type="Sprite2D" parent="InteractableLayer"]
visible = false
texture_filter = 1
texture = ExtResource("32_wheel_png")

[node name="RepairBikeShadow" type="Sprite2D" parent="InteractableLayer"]
texture_filter = 1
texture = ExtResource("40_shadow_large")

[node name="RepairBike" type="Sprite2D" parent="InteractableLayer"]
texture_filter = 1
texture = ExtResource("37_repair_slipped")

[node name="RepairBikeAligning" type="Sprite2D" parent="InteractableLayer"]
visible = false
texture_filter = 1
texture = ExtResource("43_repair_aligned")

[node name="RepairBikeSeated" type="Sprite2D" parent="InteractableLayer"]
visible = false
texture_filter = 1
texture = ExtResource("44_repair_seated")

[node name="RepairGlint" type="Sprite2D" parent="InteractableLayer"]
modulate = Color(1, 1, 1, 0.72)
texture_filter = 1
texture = ExtResource("42_glint")

[node name="DrivetrainFocusGlow" type="Sprite2D" parent="InteractableLayer"]
modulate = Color(1, 1, 1, 0.64)
texture_filter = 1
texture = ExtResource("56_chain_focus")

[node name="RepairSuccessGlint" type="Sprite2D" parent="InteractableLayer"]
visible = false
modulate = Color(1, 1, 1, 0.78)
texture_filter = 1
texture = ExtResource("42_glint")

[node name="InnerTubeProp" type="Sprite2D" parent="InteractableLayer"]
texture_filter = 1
texture = ExtResource("33_tube_png")

[node name="AirPumpProp" type="Sprite2D" parent="InteractableLayer"]
texture_filter = 1
texture = ExtResource("34_pump_png")

[node name="PatchKitProp" type="Sprite2D" parent="InteractableLayer"]
texture_filter = 1
texture = ExtResource("35_patch_kit")

[node name="StoryRepairDetails" type="Node2D" parent="InteractableLayer"]
y_sort_enabled = true

[node name="ChainSparkleGuide" type="Polygon2D" parent="InteractableLayer/StoryRepairDetails"]

[node name="LooseMasterLink" type="Polygon2D" parent="InteractableLayer/StoryRepairDetails"]

[node name="WheelLeaningGuideShadow" type="Polygon2D" parent="InteractableLayer/StoryRepairDetails"]

[node name="HalfUsedTape" type="Polygon2D" parent="InteractableLayer/StoryRepairDetails"]

[node name="WornGripMark" type="Polygon2D" parent="InteractableLayer/StoryRepairDetails"]

[node name="TinyChainGreaseDot" type="Polygon2D" parent="InteractableLayer/StoryRepairDetails"]

[node name="BentValveCap" type="Polygon2D" parent="InteractableLayer/StoryRepairDetails"]

[node name="LightingLayer" type="Node2D" parent="."]

[node name="LampGlowArt" type="Sprite2D" parent="LightingLayer"]
visible = false
texture = ExtResource("14_glow")

[node name="StringLightsProp" type="Sprite2D" parent="LightingLayer"]
texture_filter = 1
texture = ExtResource("29_string_lights")

[node name="StoryLightSpill" type="Node2D" parent="LightingLayer"]

[node name="GarageDoorWarmSpill" type="Polygon2D" parent="LightingLayer/StoryLightSpill"]

[node name="WorkbenchAmberSpill" type="Polygon2D" parent="LightingLayer/StoryLightSpill"]

[node name="DustMoteA" type="Polygon2D" parent="LightingLayer/StoryLightSpill"]

[node name="DustMoteB" type="Polygon2D" parent="LightingLayer/StoryLightSpill"]

[node name="DustMoteC" type="Polygon2D" parent="LightingLayer/StoryLightSpill"]

[node name="WorkbenchLight" type="PointLight2D" parent="LightingLayer"]
texture = SubResource("GradientTexture2D_warm_light")
color = Color(1, 0.701961, 0.278431, 1)
energy = 0.48
texture_scale = 1.6

[node name="CeilingLight" type="PointLight2D" parent="LightingLayer"]
texture = SubResource("GradientTexture2D_warm_light")
color = Color(1, 0.878431, 0.509804, 1)
energy = 0.3
texture_scale = 2.2

[node name="RepairStandLight" type="PointLight2D" parent="LightingLayer"]
texture = SubResource("GradientTexture2D_warm_light")
color = Color(1, 0.647059, 0, 1)
energy = 0.56
texture_scale = 1.85

[node name="GarageAmbientLife" type="Node" parent="."]
script = ExtResource("55_ambient_life")
flicker_targets = [NodePath("../LightingLayer/StoryLightSpill/GarageDoorWarmSpill"), NodePath("../LightingLayer/StoryLightSpill/WorkbenchAmberSpill"), NodePath("../InteractableLayer/DrivetrainFocusGlow")]
sway_targets = [NodePath("../PropLayer/StoryWorkbenchDetails/TinyFoldedRepairNote"), NodePath("../LightingLayer/StringLightsProp")]
flutter_targets = [NodePath("../LightingLayer/StoryLightSpill/DustMoteA"), NodePath("../LightingLayer/StoryLightSpill/DustMoteB"), NodePath("../LightingLayer/StoryLightSpill/DustMoteC")]
flicker_strength = 0.4
sway_strength = 0.3
flutter_strength = 0.32
speed_scale = 0.65

[node name="FXLayer" type="Node2D" parent="."]

[node name="NPCLayer" type="Node2D" parent="."]
y_sort_enabled = true

[node name="MrChenGarageNpc" parent="NPCLayer" instance=ExtResource("59_mrchen")]
position = Vector2(255, 205)
dialogue_id = "mr_chen_pre_ride_repair"

[node name="SoftShadow" type="Sprite2D" parent="NPCLayer/MrChenGarageNpc"]
texture_filter = 1
texture = ExtResource("41_shadow_small")

[node name="ZevonNpc" parent="NPCLayer" instance=ExtResource("16_zevon")]

[node name="SoftShadow" type="Sprite2D" parent="NPCLayer/ZevonNpc"]
texture_filter = 1
texture = ExtResource("41_shadow_small")

[node name="JacobNpc" parent="NPCLayer" instance=ExtResource("17_jacob")]

[node name="SoftShadow" type="Sprite2D" parent="NPCLayer/JacobNpc"]
texture_filter = 1
texture = ExtResource("41_shadow_small")

[node name="CharlieNpc" parent="NPCLayer" instance=ExtResource("18_charlie")]

[node name="SoftShadow" type="Sprite2D" parent="NPCLayer/CharlieNpc"]
texture_filter = 1
texture = ExtResource("41_shadow_small")

[node name="ColeNpc" parent="NPCLayer" instance=ExtResource("19_cole")]

[node name="SoftShadow" type="Sprite2D" parent="NPCLayer/ColeNpc"]
texture_filter = 1
texture = ExtResource("41_shadow_small")

[node name="JamesNpc" parent="NPCLayer" instance=ExtResource("20_james")]

[node name="SoftShadow" type="Sprite2D" parent="NPCLayer/JamesNpc"]
texture_filter = 1
texture = ExtResource("41_shadow_small")

[node name="PlayerLayer" type="Node2D" parent="."]
y_sort_enabled = true

[node name="Background" type="Polygon2D" parent="."]

[node name="Floor" type="Polygon2D" parent="."]
visible = false

[node name="Workbench" type="Polygon2D" parent="."]
visible = false

[node name="BikeStand" type="Polygon2D" parent="."]
visible = false

[node name="WarmLight" type="Polygon2D" parent="."]
visible = false

[node name="ToolShadow" type="Polygon2D" parent="."]
visible = false

[node name="ToolWall" type="Node2D" parent="."]

[node name="Pegboard" type="Polygon2D" parent="ToolWall"]
visible = false

[node name="Wrench" type="Polygon2D" parent="ToolWall"]
visible = false

[node name="Pump" type="Polygon2D" parent="ToolWall"]
visible = false

[node name="Sticker" type="Polygon2D" parent="ToolWall"]
visible = false

[node name="CozyRug" type="Polygon2D" parent="."]
visible = false

[node name="BikeNotes" type="Node2D" parent="."]

[node name="NoteA" type="Polygon2D" parent="BikeNotes"]
visible = false

[node name="NoteB" type="Polygon2D" parent="BikeNotes"]
visible = false

[node name="ExitZone" type="Area2D" parent="."]
script = ExtResource("3_transition")
target_region = "neighborhood_street"
target_spawn = "from_garage"

[node name="CollisionShape2D" type="CollisionShape2D" parent="ExitZone"]
shape = SubResource("RectangleShape2D_zone")

[node name="Prompt" type="Label" parent="ExitZone"]
text = "Go Outside"
horizontal_alignment = 1

[node name="ChainHotspot" type="Area2D" parent="."]
script = ExtResource("4_chain")

[node name="CollisionShape2D" type="CollisionShape2D" parent="ChainHotspot"]
shape = SubResource("RectangleShape2D_zone")

[node name="Prompt" type="Label" parent="ChainHotspot"]
text = "[Hold E] Pedal"
horizontal_alignment = 1

[node name="BikeVisual" type="Node2D" parent="ChainHotspot"]
visible = false
z_index = 12

[node name="ChainRig" parent="ChainHotspot/BikeVisual" instance=ExtResource("4b_chainrig")]

[node name="TireRepairStation" parent="." instance=ExtResource("7_tire")]

[node name="WorkshopBuildStation" type="Area2D" parent="."]
script = ExtResource("58_act1_station")
quest_id = "workshop_first_build"
objective_ids = Array[String](["collect_raw_material", "choose_workshop_friend", "craft_first_part"])
prompt_text = "First Build"
completion_message = "Zuzu and the factory friends turn one raw material into a useful first part."
completion_tone = "warm"

[node name="CollisionShape2D" type="CollisionShape2D" parent="WorkshopBuildStation"]
shape = SubResource("RectangleShape2D_workshop_station")

[node name="StationMat" type="Polygon2D" parent="WorkshopBuildStation"]

[node name="Beacon" type="Polygon2D" parent="WorkshopBuildStation"]

[node name="Sign" type="Label" parent="WorkshopBuildStation"]
modulate = Color(1, 0.94, 0.78, 0.92)
text = "First Workshop Build"
horizontal_alignment = 1
theme_override_font_sizes/font_size = 12

[node name="Prompt" type="Label" parent="WorkshopBuildStation"]
text = "First Build"
horizontal_alignment = 1

[node name="Player" type="CharacterBody2D" parent="."]
script = ExtResource("2_zuzu")

[node name="Sprite" type="AnimatedSprite2D" parent="Player"]
texture_filter = 1
position = Vector2(0, -32)
scale = Vector2(1.15, 1.15)
sprite_frames = ExtResource("15_zuzu_frames")
animation = &"idle_down"

[node name="Shadow" type="Polygon2D" parent="Player"]
visible = false
polygon = PackedVector2Array(-30, 10, 30, 10, 24, 22, -24, 22)
color = Color(0, 0, 0, 0.22)

[node name="SoftShadow" type="Sprite2D" parent="Player"]
texture_filter = 1
texture = ExtResource("41_shadow_small")

[node name="CollisionShape2D" type="CollisionShape2D" parent="Player"]
shape = SubResource("CircleShape2D_player")

[node name="Body" type="Polygon2D" parent="Player"]
visible = false
polygon = PackedVector2Array(-13, -16, 13, -16, 16, 18, -16, 18)
color = Color(0.0862745, 0.560784, 0.792157, 1)

[node name="Head" type="Polygon2D" parent="Player"]
visible = false
position = Vector2(0, -30)
polygon = PackedVector2Array(-13, -11, 13, -11, 15, 9, 0, 16, -15, 9)
color = Color(0.854902, 0.564706, 0.364706, 1)

[node name="Cap" type="Polygon2D" parent="Player"]
visible = false
position = Vector2(0, -43)
polygon = PackedVector2Array(-16, 4, -8, -8, 10, -8, 18, 3, 6, 9, -8, 8)
color = Color(0.956863, 0.376471, 0.235294, 1)

[node name="Backpack" type="Polygon2D" parent="Player"]
visible = false
position = Vector2(-15, 0)
polygon = PackedVector2Array(-5, -12, 5, -10, 5, 13, -7, 12)
color = Color(0.192157, 0.215686, 0.337255, 1)

[node name="Camera2D" type="Camera2D" parent="Player"]
enabled = true
process_callback = 0
position_smoothing_enabled = true

[node name="DialogBox" parent="." instance=ExtResource("5_dialog")]

[node name="Hud" parent="." instance=ExtResource("6_hud")]
```

---

## copper_mine - Copper Mine

Source: `BikeBrowserWorld\Regions\Mine\CopperMine.tscn`

```gdscene
[gd_scene load_steps=28 format=3 uid="uid://bikebrowser_copper_mine"]

[ext_resource type="Script" path="res://Systems/World/RegionScene.gd" id="1_region"]
[ext_resource type="Script" path="res://Systems/World/ZuzuController.gd" id="2_zuzu"]
[ext_resource type="Script" path="res://Systems/World/TransitionZone.gd" id="3_transition"]
[ext_resource type="PackedScene" path="res://Regions/NPCs/OldMinerPeteNpc.tscn" id="4_miner"]
[ext_resource type="SpriteFrames" path="res://Assets/Characters/Zuzu/Zuzu.spriteframes.tres" id="5_zuzu_frames"]
[ext_resource type="Texture2D" path="res://Assets/Props/CopperMine/mine_entrance_arch.png" id="6_mine_entrance"]
[ext_resource type="Texture2D" path="res://Assets/Props/CopperMine/copper_ore_chunk.png" id="7_ore"]
[ext_resource type="Texture2D" path="res://Assets/Props/CopperMine/mine_cart.png" id="8_cart"]
[ext_resource type="Script" path="res://Systems/Interactions/QuestObjectiveStation.gd" id="9_act1_station"]
[ext_resource type="Script" path="res://Systems/Interactions/ResourcePickup.gd" id="10_pickup"]
[ext_resource type="Script" path="res://Systems/Interactions/InspectableObject.gd" id="11_inspect"]
[ext_resource type="Script" path="res://Systems/Interactions/ChallengeStation.gd" id="12_challenge"]
[ext_resource type="Texture2D" path="res://Assets/Props/CopperMine/surface_copper_rocks.png" id="13_surface_copper"]
[ext_resource type="Texture2D" path="res://Assets/Props/CopperMine/deep_copper_ore.png" id="14_deep_copper"]
[ext_resource type="Texture2D" path="res://Assets/Props/CopperMine/wire_spool.png" id="15_wire_spool"]
[ext_resource type="Texture2D" path="res://Assets/Props/CopperMine/timber_support_beam.png" id="16_support_beam"]
[ext_resource type="Texture2D" path="res://Assets/Props/CopperMine/conductivity_test_station.png" id="17_conductivity_station"]
[ext_resource type="Texture2D" path="res://Assets/Props/CopperMine/mine_depth_marker.png" id="18_depth_marker"]
[ext_resource type="Texture2D" path="res://Assets/Props/CopperMine/lantern.png" id="19_lantern"]
[ext_resource type="Texture2D" path="res://Assets/Props/CopperMine/dust_pile_rubble.png" id="20_rubble"]

[sub_resource type="CircleShape2D" id="CircleShape2D_player"]
radius = 18.0

[sub_resource type="RectangleShape2D" id="RectangleShape2D_exit"]
size = Vector2(160, 72)

[sub_resource type="RectangleShape2D" id="RectangleShape2D_ore"]
size = Vector2(190, 104)

[sub_resource type="CircleShape2D" id="CircleShape2D_pickup"]
radius = 36.0

[sub_resource type="RectangleShape2D" id="RectangleShape2D_inspect"]
size = Vector2(120, 78)

[sub_resource type="RectangleShape2D" id="RectangleShape2D_challenge"]
size = Vector2(154, 96)

[node name="CopperMine" type="Node2D"]
script = ExtResource("1_region")
region_id = "copper_mine"
layout_path = "res://Data/layouts/copper_mine.json"

[node name="Background" type="Polygon2D" parent="."]

[node name="Ground" type="Polygon2D" parent="."]

[node name="MineEntrance" type="Sprite2D" parent="."]
texture_filter = 1
texture = ExtResource("6_mine_entrance")

[node name="OreA" type="Sprite2D" parent="."]
texture_filter = 1
texture = ExtResource("7_ore")

[node name="OreB" type="Sprite2D" parent="."]
texture_filter = 1
texture = ExtResource("7_ore")

[node name="MineCart" type="Sprite2D" parent="."]
texture_filter = 1
texture = ExtResource("8_cart")

[node name="OldMinerPeteNpc" parent="." instance=ExtResource("4_miner")]

[node name="SurfaceCopperPickup" type="Area2D" parent="."]
script = ExtResource("10_pickup")
item_id = "surface_copper"
item_kind = "materials"
quest_id = "copper_prospector"
objective_id = "collect_surface_copper"
discovery_id = "copper_mine_surface_copper"
prompt_text = "Collect surface copper"
collected_message = "Surface copper added to the field pouch."

[node name="Sprite" type="Sprite2D" parent="SurfaceCopperPickup"]
texture_filter = 1
texture = ExtResource("13_surface_copper")

[node name="CollisionShape2D" type="CollisionShape2D" parent="SurfaceCopperPickup"]
shape = SubResource("CircleShape2D_pickup")

[node name="DeepCopperPickup" type="Area2D" parent="."]
script = ExtResource("10_pickup")
item_id = "deep_copper"
item_kind = "materials"
quest_id = "copper_prospector"
objective_id = "collect_deep_copper"
discovery_id = "copper_mine_deep_copper"
prompt_text = "Collect deep copper"
collected_message = "Deep copper sample packed safely."

[node name="Sprite" type="Sprite2D" parent="DeepCopperPickup"]
texture_filter = 1
texture = ExtResource("14_deep_copper")

[node name="CollisionShape2D" type="CollisionShape2D" parent="DeepCopperPickup"]
shape = SubResource("CircleShape2D_pickup")

[node name="WireSpoolPickup" type="Area2D" parent="."]
script = ExtResource("10_pickup")
item_id = "wire_spool"
item_kind = "materials"
quest_id = "copper_prospector"
objective_id = "collect_wire_spool"
discovery_id = "copper_mine_wire_spool"
prompt_text = "Collect wire spool"
collected_message = "Wire spool added for workshop circuits."

[node name="Sprite" type="Sprite2D" parent="WireSpoolPickup"]
texture_filter = 1
texture = ExtResource("15_wire_spool")

[node name="CollisionShape2D" type="CollisionShape2D" parent="WireSpoolPickup"]
shape = SubResource("CircleShape2D_pickup")

[node name="ConductivityChallenge" type="Area2D" parent="."]
script = ExtResource("12_challenge")
challenge_id = "copper_conductivity_question"
quest_id = "copper_prospector"
objective_id = "conductivity_question"
prompt_text = "Answer conductivity"
question = "Which material conducts better than copper?"
choices = Array[String](["Silver", "Iron", "Aluminum", "Rubber"])
correct_choice_index = 0
success_text = "Silver conducts best, but copper is much cheaper and still excellent."
retry_text = "Think about metals with the freest-moving electrons."

[node name="Sprite" type="Sprite2D" parent="ConductivityChallenge"]
texture_filter = 1
scale = Vector2(0.48, 0.48)
texture = ExtResource("17_conductivity_station")

[node name="CollisionShape2D" type="CollisionShape2D" parent="ConductivityChallenge"]
shape = SubResource("RectangleShape2D_challenge")

[node name="SupportBeamInspectable" type="Area2D" parent="."]
script = ExtResource("11_inspect")
inspect_id = "mine_support_beam"
quest_id = "mine_stability_check"
objective_id = "inspect_support_beam"
prompt_text = "Inspect support beam"
observation_text = "The timber support is doing real work: cracks, lean, and spacing show how load travels into the ground."
notebook_tag = "mine_stability"
once_only = true

[node name="Sprite" type="Sprite2D" parent="SupportBeamInspectable"]
texture_filter = 1
texture = ExtResource("16_support_beam")

[node name="CollisionShape2D" type="CollisionShape2D" parent="SupportBeamInspectable"]
shape = SubResource("RectangleShape2D_inspect")

[node name="LoadCapacityChallenge" type="Area2D" parent="."]
script = ExtResource("12_challenge")
challenge_id = "mine_load_capacity"
quest_id = "mine_stability_check"
objective_id = "calculate_load_capacity"
prompt_text = "Calculate load"
question = "A beam holds 500 kg. Rock above weighs 450 kg. What percentage is used?"
choices = Array[String](["90%", "50%", "110%", "45%"])
correct_choice_index = 0
success_text = "450 divided by 500 is 0.9, so the beam is using 90% of capacity."
retry_text = "Divide the load by the capacity, then convert to percent."

[node name="Sprite" type="Sprite2D" parent="LoadCapacityChallenge"]
texture_filter = 1
scale = Vector2(0.72, 0.72)
texture = ExtResource("18_depth_marker")

[node name="CollisionShape2D" type="CollisionShape2D" parent="LoadCapacityChallenge"]
shape = SubResource("RectangleShape2D_challenge")

[node name="RubbleDensityInspectable" type="Area2D" parent="."]
script = ExtResource("11_inspect")
inspect_id = "mine_rubble_density"
quest_id = "mine_stability_check"
objective_id = "mark_rubble_density"
prompt_text = "Inspect rubble"
observation_text = "Lantern light, fresh rubble, and tight support spacing tell Zuzu this area needs careful load limits."
notebook_tag = "mine_stability"
once_only = true

[node name="Lantern" type="Sprite2D" parent="RubbleDensityInspectable"]
texture_filter = 1
position = Vector2(-28, -22)
texture = ExtResource("19_lantern")

[node name="Rubble" type="Sprite2D" parent="RubbleDensityInspectable"]
texture_filter = 1
position = Vector2(20, 16)
scale = Vector2(1.18, 1.18)
texture = ExtResource("20_rubble")

[node name="CollisionShape2D" type="CollisionShape2D" parent="RubbleDensityInspectable"]
shape = SubResource("RectangleShape2D_inspect")

[node name="CopperEvidenceStation" type="Area2D" parent="."]
script = ExtResource("9_act1_station")
quest_id = "copper_rock_id"
objective_ids = Array[String](["find_copper_rock", "test_conductivity", "report_to_pete"])
prompt_text = "Test Copper"
completion_message = "Zuzu observes the blue-green stain, tests conductivity, and reports the copper evidence to Pete."
completion_tone = "warm"

[node name="CollisionShape2D" type="CollisionShape2D" parent="CopperEvidenceStation"]
shape = SubResource("RectangleShape2D_ore")

[node name="StationMat" type="Polygon2D" parent="CopperEvidenceStation"]

[node name="Beacon" type="Polygon2D" parent="CopperEvidenceStation"]

[node name="Sign" type="Label" parent="CopperEvidenceStation"]
modulate = Color(1, 0.94, 0.78, 0.92)
text = "Copper Evidence"
horizontal_alignment = 1
theme_override_font_sizes/font_size = 12

[node name="Prompt" type="Label" parent="CopperEvidenceStation"]
text = "Test Copper"
horizontal_alignment = 1

[node name="BackToNeighborhood" type="Area2D" parent="."]
script = ExtResource("3_transition")
target_region = "neighborhood_street"
target_spawn = "from_mine"
require_accept = false
feedback_message = "Zuzu rides back from the copper mine."

[node name="CollisionShape2D" type="CollisionShape2D" parent="BackToNeighborhood"]
shape = SubResource("RectangleShape2D_exit")

[node name="Prompt" type="Label" parent="BackToNeighborhood"]
text = "Neighborhood"
horizontal_alignment = 1

[node name="Player" type="CharacterBody2D" parent="."]
script = ExtResource("2_zuzu")

[node name="Sprite" type="AnimatedSprite2D" parent="Player"]
texture_filter = 1
position = Vector2(0, -32)
scale = Vector2(1.15, 1.15)
sprite_frames = ExtResource("5_zuzu_frames")
animation = &"idle_down"

[node name="CollisionShape2D" type="CollisionShape2D" parent="Player"]
shape = SubResource("CircleShape2D_player")

[node name="Camera2D" type="Camera2D" parent="Player"]
enabled = true
process_callback = 0
position_smoothing_enabled = true
```

---

## desert_trail - Desert Trail

Source: `BikeBrowserWorld\Regions\Desert\DesertTrail.tscn`

```gdscene
[gd_scene load_steps=34 format=3 uid="uid://bikebrowser_desert_trail"]

[ext_resource type="Script" path="res://Systems/World/RegionScene.gd" id="1_region"]
[ext_resource type="Script" path="res://Systems/World/ZuzuController.gd" id="2_zuzu"]
[ext_resource type="Script" path="res://Systems/World/TransitionZone.gd" id="3_transition"]
[ext_resource type="PackedScene" path="res://Regions/NPCs/RangerNitaNpc.tscn" id="4_ranger"]
[ext_resource type="SpriteFrames" path="res://Assets/Characters/Zuzu/Zuzu.spriteframes.tres" id="5_zuzu_frames"]
[ext_resource type="Texture2D" path="res://Assets/Props/Desert/trail_marker_sign.png" id="6_trail_sign"]
[ext_resource type="Texture2D" path="res://Assets/Props/Desert/barrel_cactus.png" id="7_barrel"]
[ext_resource type="Texture2D" path="res://Assets/Props/Desert/agave.png" id="8_agave"]
[ext_resource type="Texture2D" path="res://Assets/Props/Desert/mesquite_tree.png" id="9_mesquite"]
[ext_resource type="Script" path="res://Systems/Interactions/PlantObservationStation.gd" id="10_act1_station"]
[ext_resource type="Script" path="res://Systems/Interactions/ResourcePickup.gd" id="11_pickup"]
[ext_resource type="Script" path="res://Systems/Interactions/InspectableObject.gd" id="12_inspect"]
[ext_resource type="Script" path="res://Systems/Interactions/ChallengeStation.gd" id="13_challenge"]
[ext_resource type="Texture2D" path="res://Assets/Props/Desert/yucca.png" id="14_yucca"]
[ext_resource type="Texture2D" path="res://Assets/Props/Desert/jojoba_shrub.png" id="15_jojoba"]
[ext_resource type="Texture2D" path="res://Assets/Props/Neighborhood/creosote_bush.png" id="16_creosote"]
[ext_resource type="Texture2D" path="res://Assets/Props/Desert/prickly_pear_with_fruit.png" id="17_prickly"]
[ext_resource type="Texture2D" path="res://Assets/Props/Desert/scavenge_spot.png" id="18_scavenge"]
[ext_resource type="Texture2D" path="res://Assets/Props/Desert/old_crate.png" id="19_crate"]
[ext_resource type="Texture2D" path="res://Assets/Props/Desert/foraging_basket.png" id="20_basket"]
[ext_resource type="Texture2D" path="res://Assets/Props/Desert/field_guide_binoculars.png" id="21_field_guide"]

[sub_resource type="CircleShape2D" id="CircleShape2D_player"]
radius = 18.0

[sub_resource type="RectangleShape2D" id="RectangleShape2D_exit"]
size = Vector2(160, 72)

[sub_resource type="RectangleShape2D" id="RectangleShape2D_observation"]
size = Vector2(190, 104)

[sub_resource type="CircleShape2D" id="CircleShape2D_pickup"]
radius = 34.0

[sub_resource type="RectangleShape2D" id="RectangleShape2D_inspect"]
size = Vector2(134, 84)

[sub_resource type="RectangleShape2D" id="RectangleShape2D_challenge"]
size = Vector2(150, 92)

[node name="DesertTrail" type="Node2D"]
script = ExtResource("1_region")
region_id = "desert_trail"
layout_path = "res://Data/layouts/desert_trail.json"

[node name="Background" type="Polygon2D" parent="."]

[node name="Trail" type="Polygon2D" parent="."]

[node name="TrailMarker" type="Sprite2D" parent="."]
texture_filter = 1
texture = ExtResource("6_trail_sign")

[node name="BarrelCactusA" type="Sprite2D" parent="."]
texture_filter = 1
texture = ExtResource("7_barrel")

[node name="BarrelCactusB" type="Sprite2D" parent="."]
texture_filter = 1
texture = ExtResource("7_barrel")

[node name="AgaveA" type="Sprite2D" parent="."]
texture_filter = 1
texture = ExtResource("8_agave")

[node name="MesquiteTree" type="Sprite2D" parent="."]
texture_filter = 1
texture = ExtResource("9_mesquite")

[node name="RangerNitaNpc" parent="." instance=ExtResource("4_ranger")]

[node name="YuccaFiberPickup" type="Area2D" parent="."]
script = ExtResource("11_pickup")
item_id = "yucca_fiber"
item_kind = "plants"
quest_id = "desert_foraging_samples"
objective_id = "gather_yucca"
discovery_id = "desert_yucca_fiber"
prompt_text = "Gather yucca fiber"
collected_message = "Yucca fiber wrapped for material notes."

[node name="Sprite" type="Sprite2D" parent="YuccaFiberPickup"]
texture_filter = 1
texture = ExtResource("14_yucca")

[node name="CollisionShape2D" type="CollisionShape2D" parent="YuccaFiberPickup"]
shape = SubResource("CircleShape2D_pickup")

[node name="AgaveFiberPickup" type="Area2D" parent="."]
script = ExtResource("11_pickup")
item_id = "agave_fiber"
item_kind = "plants"
quest_id = "desert_foraging_samples"
objective_id = "gather_agave"
discovery_id = "desert_agave_fiber"
prompt_text = "Gather agave fiber"
collected_message = "Agave fiber sample added."

[node name="Sprite" type="Sprite2D" parent="AgaveFiberPickup"]
texture_filter = 1
texture = ExtResource("8_agave")

[node name="CollisionShape2D" type="CollisionShape2D" parent="AgaveFiberPickup"]
shape = SubResource("CircleShape2D_pickup")

[node name="JojobaPickup" type="Area2D" parent="."]
script = ExtResource("11_pickup")
item_id = "jojoba_bean"
item_kind = "plants"
quest_id = "desert_foraging_samples"
objective_id = "gather_jojoba"
discovery_id = "desert_jojoba"
prompt_text = "Collect jojoba"
collected_message = "Jojoba sample goes into the plant pouch."

[node name="Sprite" type="Sprite2D" parent="JojobaPickup"]
texture_filter = 1
texture = ExtResource("15_jojoba")

[node name="CollisionShape2D" type="CollisionShape2D" parent="JojobaPickup"]
shape = SubResource("CircleShape2D_pickup")

[node name="CreosotePickup" type="Area2D" parent="."]
script = ExtResource("11_pickup")
item_id = "creosote_leaves"
item_kind = "plants"
quest_id = "desert_foraging_samples"
objective_id = "gather_creosote"
discovery_id = "desert_creosote"
prompt_text = "Collect creosote"
collected_message = "Creosote leaves noted for plant chemistry."

[node name="Sprite" type="Sprite2D" parent="CreosotePickup"]
texture_filter = 1
texture = ExtResource("16_creosote")

[node name="CollisionShape2D" type="CollisionShape2D" parent="CreosotePickup"]
shape = SubResource("CircleShape2D_pickup")

[node name="CactusWaterPickup" type="Area2D" parent="."]
script = ExtResource("11_pickup")
item_id = "cactus_water"
item_kind = "plants"
quest_id = "desert_foraging_samples"
objective_id = "note_cactus_water"
discovery_id = "desert_cactus_water"
prompt_text = "Note cactus water"
collected_message = "Cactus water storage recorded without harming the plant."

[node name="Sprite" type="Sprite2D" parent="CactusWaterPickup"]
texture_filter = 1
texture = ExtResource("17_prickly")

[node name="CollisionShape2D" type="CollisionShape2D" parent="CactusWaterPickup"]
shape = SubResource("CircleShape2D_pickup")

[node name="TrailMarkerInspectable" type="Area2D" parent="."]
script = ExtResource("12_inspect")
inspect_id = "desert_trail_marker"
quest_id = "desert_water_management"
objective_id = "inspect_trail_marker"
prompt_text = "Inspect trail marker"
observation_text = "The marker gives distance, direction, and the safest return path before heat becomes a problem."
notebook_tag = "desert_navigation"
once_only = true

[node name="Sprite" type="Sprite2D" parent="TrailMarkerInspectable"]
texture_filter = 1
texture = ExtResource("6_trail_sign")

[node name="CollisionShape2D" type="CollisionShape2D" parent="TrailMarkerInspectable"]
shape = SubResource("RectangleShape2D_inspect")

[node name="ScavengeInspectable" type="Area2D" parent="."]
script = ExtResource("12_inspect")
inspect_id = "desert_scavenge_spot"
quest_id = "desert_water_management"
objective_id = "inspect_scavenge_spot"
prompt_text = "Inspect crate"
observation_text = "The old crate is a field clue, not a free-for-all: useful parts get checked before anyone carries them."
notebook_tag = "desert_safety"
once_only = true

[node name="Scavenge" type="Sprite2D" parent="ScavengeInspectable"]
texture_filter = 1
position = Vector2(-20, 10)
texture = ExtResource("18_scavenge")

[node name="Crate" type="Sprite2D" parent="ScavengeInspectable"]
texture_filter = 1
position = Vector2(24, -18)
texture = ExtResource("19_crate")

[node name="CollisionShape2D" type="CollisionShape2D" parent="ScavengeInspectable"]
shape = SubResource("RectangleShape2D_inspect")

[node name="WaterHoursChallenge" type="Area2D" parent="."]
script = ExtResource("13_challenge")
challenge_id = "desert_water_hours"
quest_id = "desert_water_management"
objective_id = "water_hours_question"
prompt_text = "Plan water"
question = "2 liters is 2000 ml. At 250 ml per hour, how many hours?"
choices = Array[String](["8 hours", "6 hours", "10 hours", "4 hours"])
correct_choice_index = 0
success_text = "2000 divided by 250 is 8 hours."
retry_text = "Convert liters to milliliters, then divide."

[node name="Sprite" type="Sprite2D" parent="WaterHoursChallenge"]
texture_filter = 1
texture = ExtResource("20_basket")

[node name="CollisionShape2D" type="CollisionShape2D" parent="WaterHoursChallenge"]
shape = SubResource("RectangleShape2D_challenge")

[node name="PlantRatioChallenge" type="Area2D" parent="."]
script = ExtResource("13_challenge")
challenge_id = "desert_plant_ratio"
quest_id = "desert_water_management"
objective_id = "plant_ratio_question"
prompt_text = "Compare plants"
question = "If 2 of 5 samples are fiber plants, what fraction are fiber plants?"
choices = Array[String](["2/5", "3/5", "1/5", "5/5"])
correct_choice_index = 0
success_text = "Two fiber samples out of five total samples is 2/5."
retry_text = "Put fiber samples over total samples."

[node name="Sprite" type="Sprite2D" parent="PlantRatioChallenge"]
texture_filter = 1
texture = ExtResource("21_field_guide")

[node name="CollisionShape2D" type="CollisionShape2D" parent="PlantRatioChallenge"]
shape = SubResource("RectangleShape2D_challenge")

[node name="HeatSurvivalChallenge" type="Area2D" parent="."]
script = ExtResource("13_challenge")
challenge_id = "desert_heat_survival"
quest_id = "desert_water_management"
objective_id = "heat_survival_question"
prompt_text = "Pick heat plan"
question = "What is the safest desert heat plan?"
choices = Array[String](["Shade, water, return route", "Run faster", "Skip water", "Leave the trail"])
correct_choice_index = 0
success_text = "Shade, water, and a return route beat bravado every time."
retry_text = "Pick the plan that lowers heat risk and keeps the route clear."

[node name="Sprite" type="Sprite2D" parent="HeatSurvivalChallenge"]
texture_filter = 1
texture = ExtResource("20_basket")

[node name="CollisionShape2D" type="CollisionShape2D" parent="HeatSurvivalChallenge"]
shape = SubResource("RectangleShape2D_challenge")

[node name="PlantObservationStation" type="Area2D" parent="."]
script = ExtResource("10_act1_station")
quest_id = "desert_plant_observation"
objective_ids = Array[String](["talk_to_ranger_nita", "observe_three_plants", "journal_observations", "return_to_nita"])
prompt_text = "Plant Notes"
completion_message = "Zuzu matches plant structures with field marks, records mastery for each plant, and reports careful notes to Ranger Nita."
completion_tone = "warm"

[node name="CollisionShape2D" type="CollisionShape2D" parent="PlantObservationStation"]
shape = SubResource("RectangleShape2D_observation")

[node name="StationMat" type="Polygon2D" parent="PlantObservationStation"]

[node name="Beacon" type="Polygon2D" parent="PlantObservationStation"]

[node name="Sign" type="Label" parent="PlantObservationStation"]
modulate = Color(1, 0.94, 0.78, 0.92)
text = "Plant Observation"
horizontal_alignment = 1
theme_override_font_sizes/font_size = 12

[node name="Prompt" type="Label" parent="PlantObservationStation"]
text = "Plant Notes"
horizontal_alignment = 1

[node name="BackToNeighborhood" type="Area2D" parent="."]
script = ExtResource("3_transition")
target_region = "neighborhood_street"
target_spawn = "from_desert"
require_accept = false
feedback_message = "Zuzu rides back from the desert trail."

[node name="CollisionShape2D" type="CollisionShape2D" parent="BackToNeighborhood"]
shape = SubResource("RectangleShape2D_exit")

[node name="Prompt" type="Label" parent="BackToNeighborhood"]
text = "Neighborhood"
horizontal_alignment = 1

[node name="Player" type="CharacterBody2D" parent="."]
script = ExtResource("2_zuzu")

[node name="Sprite" type="AnimatedSprite2D" parent="Player"]
texture_filter = 1
position = Vector2(0, -32)
scale = Vector2(1.15, 1.15)
sprite_frames = ExtResource("5_zuzu_frames")
animation = &"idle_down"

[node name="CollisionShape2D" type="CollisionShape2D" parent="Player"]
shape = SubResource("CircleShape2D_player")

[node name="Camera2D" type="Camera2D" parent="Player"]
enabled = true
process_callback = 0
position_smoothing_enabled = true
```

---

## salt_river - Salt River

Source: `BikeBrowserWorld\Regions\River\SaltRiver.tscn`

```gdscene
[gd_scene load_steps=31 format=3 uid="uid://bikebrowser_salt_river"]

[ext_resource type="Script" path="res://Systems/World/RegionScene.gd" id="1_region"]
[ext_resource type="Script" path="res://Systems/World/ZuzuController.gd" id="2_zuzu"]
[ext_resource type="Script" path="res://Systems/World/TransitionZone.gd" id="3_transition"]
[ext_resource type="PackedScene" path="res://Regions/NPCs/DrMayaNpc.tscn" id="4_maya"]
[ext_resource type="SpriteFrames" path="res://Assets/Characters/Zuzu/Zuzu.spriteframes.tres" id="5_zuzu_frames"]
[ext_resource type="Texture2D" path="res://Assets/Props/SaltRiver/river_water_tile.png" id="6_water"]
[ext_resource type="Texture2D" path="res://Assets/Props/SaltRiver/small_dock_boardwalk.png" id="7_dock"]
[ext_resource type="Texture2D" path="res://Assets/Props/SaltRiver/water_sampling_kit.png" id="8_sampling"]
[ext_resource type="Texture2D" path="res://Assets/Props/SaltRiver/cattail_plant.png" id="9_cattail"]
[ext_resource type="Script" path="res://Systems/Interactions/WaterQualityStation.gd" id="10_act1_station"]
[ext_resource type="Script" path="res://Systems/Interactions/ResourcePickup.gd" id="11_pickup"]
[ext_resource type="Script" path="res://Systems/Interactions/InspectableObject.gd" id="12_inspect"]
[ext_resource type="Script" path="res://Systems/Interactions/ChallengeStation.gd" id="13_challenge"]
[ext_resource type="Texture2D" path="res://Assets/Props/SaltRiver/algae_sample.png" id="14_algae"]
[ext_resource type="Texture2D" path="res://Assets/Props/SaltRiver/microbial_sample_jar.png" id="15_microbes"]
[ext_resource type="Texture2D" path="res://Assets/Props/SaltRiver/mineral_deposit.png" id="16_minerals"]
[ext_resource type="Texture2D" path="res://Assets/Props/SaltRiver/reed_fiber_plant.png" id="17_reed"]
[ext_resource type="Texture2D" path="res://Assets/Props/SaltRiver/flow_rate_marker.png" id="18_flow"]
[ext_resource type="Texture2D" path="res://Assets/Props/SaltRiver/irrigation_channel_sign.png" id="19_channel"]
[ext_resource type="Texture2D" path="res://Assets/Props/SaltRiver/macroinvertebrate_tray.png" id="20_foodweb"]
[ext_resource type="Texture2D" path="res://Assets/Props/SaltRiver/dragonfly.png" id="21_dragonfly"]

[sub_resource type="CircleShape2D" id="CircleShape2D_player"]
radius = 18.0

[sub_resource type="RectangleShape2D" id="RectangleShape2D_exit"]
size = Vector2(200, 72)

[sub_resource type="RectangleShape2D" id="RectangleShape2D_water"]
size = Vector2(200, 104)

[sub_resource type="CircleShape2D" id="CircleShape2D_pickup"]
radius = 34.0

[sub_resource type="RectangleShape2D" id="RectangleShape2D_inspect"]
size = Vector2(128, 80)

[sub_resource type="RectangleShape2D" id="RectangleShape2D_challenge"]
size = Vector2(150, 92)

[node name="SaltRiver" type="Node2D"]
script = ExtResource("1_region")
region_id = "salt_river"
layout_path = "res://Data/layouts/salt_river.json"

[node name="Background" type="Polygon2D" parent="."]

[node name="RiverBand" type="Sprite2D" parent="."]
texture_filter = 1
texture = ExtResource("6_water")

[node name="SandyBank" type="Polygon2D" parent="."]

[node name="Dock" type="Sprite2D" parent="."]
texture_filter = 1
texture = ExtResource("7_dock")

[node name="SamplingKit" type="Sprite2D" parent="."]
texture_filter = 1
texture = ExtResource("8_sampling")

[node name="CattailA" type="Sprite2D" parent="."]
texture_filter = 1
texture = ExtResource("9_cattail")

[node name="CattailB" type="Sprite2D" parent="."]
texture_filter = 1
texture = ExtResource("9_cattail")

[node name="DrMayaNpc" parent="." instance=ExtResource("4_maya")]

[node name="AlgaeSamplePickup" type="Area2D" parent="."]
script = ExtResource("11_pickup")
item_id = "algae_sample"
item_kind = "biology"
quest_id = "river_ecosystem_survey"
objective_id = "collect_algae"
discovery_id = "salt_river_algae_sample"
prompt_text = "Collect algae"
collected_message = "Algae sample sealed in a small jar."

[node name="Sprite" type="Sprite2D" parent="AlgaeSamplePickup"]
texture_filter = 1
texture = ExtResource("14_algae")

[node name="CollisionShape2D" type="CollisionShape2D" parent="AlgaeSamplePickup"]
shape = SubResource("CircleShape2D_pickup")

[node name="MicrobialSamplePickup" type="Area2D" parent="."]
script = ExtResource("11_pickup")
item_id = "microbial_sample"
item_kind = "biology"
quest_id = "river_ecosystem_survey"
objective_id = "collect_microbes"
discovery_id = "salt_river_microbial_sample"
prompt_text = "Collect microbes"
collected_message = "Microbial sample jar packed for the lab."

[node name="Sprite" type="Sprite2D" parent="MicrobialSamplePickup"]
texture_filter = 1
texture = ExtResource("15_microbes")

[node name="CollisionShape2D" type="CollisionShape2D" parent="MicrobialSamplePickup"]
shape = SubResource("CircleShape2D_pickup")

[node name="RiverMineralsPickup" type="Area2D" parent="."]
script = ExtResource("11_pickup")
item_id = "river_minerals"
item_kind = "biology"
quest_id = "balance_the_flow"
objective_id = "collect_river_minerals"
discovery_id = "salt_river_minerals"
prompt_text = "Collect minerals"
collected_message = "River mineral grains go into a labeled pouch."

[node name="Sprite" type="Sprite2D" parent="RiverMineralsPickup"]
texture_filter = 1
texture = ExtResource("16_minerals")

[node name="CollisionShape2D" type="CollisionShape2D" parent="RiverMineralsPickup"]
shape = SubResource("CircleShape2D_pickup")

[node name="ReedFiberPickup" type="Area2D" parent="."]
script = ExtResource("11_pickup")
item_id = "reed_fiber"
item_kind = "plants"
quest_id = "balance_the_flow"
objective_id = "collect_reed_fiber"
discovery_id = "salt_river_reed_fiber"
prompt_text = "Collect reed fiber"
collected_message = "Reed fiber sample wrapped for the notebook."

[node name="Sprite" type="Sprite2D" parent="ReedFiberPickup"]
texture_filter = 1
texture = ExtResource("17_reed")

[node name="CollisionShape2D" type="CollisionShape2D" parent="ReedFiberPickup"]
shape = SubResource("CircleShape2D_pickup")

[node name="FoodWebInspectable" type="Area2D" parent="."]
script = ExtResource("12_inspect")
inspect_id = "salt_river_food_web"
quest_id = "river_ecosystem_survey"
objective_id = "observe_fish_patterns"
prompt_text = "Observe food web"
observation_text = "The shallow edge shows a chain of life: algae, tiny water animals, insects, fish, and birds."
notebook_tag = "river_ecology"
once_only = true

[node name="Tray" type="Sprite2D" parent="FoodWebInspectable"]
texture_filter = 1
texture = ExtResource("20_foodweb")

[node name="Dragonfly" type="Sprite2D" parent="FoodWebInspectable"]
texture_filter = 1
position = Vector2(42, -34)
scale = Vector2(0.85, 0.85)
texture = ExtResource("21_dragonfly")

[node name="CollisionShape2D" type="CollisionShape2D" parent="FoodWebInspectable"]
shape = SubResource("RectangleShape2D_inspect")

[node name="FlowRateChallenge" type="Area2D" parent="."]
script = ExtResource("13_challenge")
challenge_id = "salt_river_flow_rate"
quest_id = "river_ecosystem_survey"
objective_id = "flow_rate_question"
prompt_text = "Solve flow rate"
question = "River flows 3 m/s. Fish swims upstream 1 m/s. Relative to the ground?"
choices = Array[String](["2 m/s upstream", "4 m/s upstream", "3 m/s downstream", "1 m/s upstream"])
correct_choice_index = 0
success_text = "Against the current, subtract: 3 minus 1 gives 2 m/s."
retry_text = "The fish is swimming against the current, so subtract speeds."

[node name="Sprite" type="Sprite2D" parent="FlowRateChallenge"]
texture_filter = 1
texture = ExtResource("18_flow")

[node name="CollisionShape2D" type="CollisionShape2D" parent="FlowRateChallenge"]
shape = SubResource("RectangleShape2D_challenge")

[node name="IrrigationInspectable" type="Area2D" parent="."]
script = ExtResource("12_inspect")
inspect_id = "salt_river_irrigation_channels"
quest_id = "balance_the_flow"
objective_id = "inspect_channels"
prompt_text = "Inspect channels"
observation_text = "Three channels split one flow. If one branch clogs, the whole river edge changes."
notebook_tag = "river_flow"
once_only = true

[node name="Sprite" type="Sprite2D" parent="IrrigationInspectable"]
texture_filter = 1
texture = ExtResource("19_channel")

[node name="CollisionShape2D" type="CollisionShape2D" parent="IrrigationInspectable"]
shape = SubResource("RectangleShape2D_inspect")

[node name="IrrigationFractionChallenge" type="Area2D" parent="."]
script = ExtResource("13_challenge")
challenge_id = "salt_river_irrigation_fraction"
quest_id = "balance_the_flow"
objective_id = "fraction_question"
prompt_text = "Balance flow"
question = "A gets 2/5 and B gets 1/5. What fraction goes to C?"
choices = Array[String](["2/5", "1/5", "3/5", "5/5"])
correct_choice_index = 0
success_text = "2/5 plus 1/5 uses 3/5, so 2/5 remains for channel C."
retry_text = "Add A and B, then subtract from the whole 5/5."

[node name="Sprite" type="Sprite2D" parent="IrrigationFractionChallenge"]
texture_filter = 1
texture = ExtResource("19_channel")

[node name="CollisionShape2D" type="CollisionShape2D" parent="IrrigationFractionChallenge"]
shape = SubResource("RectangleShape2D_challenge")

[node name="WaterQualityStation" type="Area2D" parent="."]
script = ExtResource("10_act1_station")
quest_id = "test_water_quality"
objective_ids = Array[String](["talk_to_dr_maya", "collect_water_sample", "run_ph_test", "identify_macroinvertebrates", "report_results"])
prompt_text = "Water Test"
completion_message = "Zuzu collects a sample, tests pH, identifies a mayfly nymph, infers likely healthy water, and reports the evidence chain to Dr. Maya."
completion_tone = "warm"

[node name="CollisionShape2D" type="CollisionShape2D" parent="WaterQualityStation"]
shape = SubResource("RectangleShape2D_water")

[node name="StationMat" type="Polygon2D" parent="WaterQualityStation"]

[node name="Beacon" type="Polygon2D" parent="WaterQualityStation"]

[node name="Sign" type="Label" parent="WaterQualityStation"]
modulate = Color(1, 0.94, 0.78, 0.92)
text = "Water Quality"
horizontal_alignment = 1
theme_override_font_sizes/font_size = 12

[node name="Prompt" type="Label" parent="WaterQualityStation"]
text = "Water Test"
horizontal_alignment = 1

[node name="BackToNeighborhood" type="Area2D" parent="."]
script = ExtResource("3_transition")
target_region = "neighborhood_street"
target_spawn = "from_river"
require_accept = false
feedback_message = "Zuzu rides back from the Salt River."

[node name="CollisionShape2D" type="CollisionShape2D" parent="BackToNeighborhood"]
shape = SubResource("RectangleShape2D_exit")

[node name="Prompt" type="Label" parent="BackToNeighborhood"]
text = "Neighborhood"
horizontal_alignment = 1

[node name="Player" type="CharacterBody2D" parent="."]
script = ExtResource("2_zuzu")

[node name="Sprite" type="AnimatedSprite2D" parent="Player"]
texture_filter = 1
position = Vector2(0, -32)
scale = Vector2(1.15, 1.15)
sprite_frames = ExtResource("5_zuzu_frames")
animation = &"idle_down"

[node name="CollisionShape2D" type="CollisionShape2D" parent="Player"]
shape = SubResource("CircleShape2D_player")

[node name="Camera2D" type="Camera2D" parent="Player"]
enabled = true
process_callback = 0
position_smoothing_enabled = true
```

---

## dry_wash - Dry Wash Bridge

Source: `BikeBrowserWorld\Regions\DryWash\DryWash.tscn`

```gdscene
[gd_scene load_steps=24 format=3 uid="uid://bikebrowser_dry_wash"]

[ext_resource type="Script" path="res://Systems/World/RegionScene.gd" id="1_region"]
[ext_resource type="Script" path="res://Systems/World/ZuzuController.gd" id="2_zuzu"]
[ext_resource type="Script" path="res://Systems/World/TransitionZone.gd" id="3_transition"]
[ext_resource type="PackedScene" path="res://Regions/NPCs/MrChenNpc.tscn" id="4_mrchen"]
[ext_resource type="SpriteFrames" path="res://Assets/Characters/Zuzu/Zuzu.spriteframes.tres" id="5_zuzu_frames"]
[ext_resource type="Script" path="res://Systems/Interactions/QuestObjectiveStation.gd" id="6_station"]
[ext_resource type="Script" path="res://Systems/Interactions/InspectableObject.gd" id="7_inspect"]
[ext_resource type="Texture2D" path="res://Assets/Props/DryWash/dry_wash_channel_tile.png" id="8_channel"]
[ext_resource type="Texture2D" path="res://Assets/Props/DryWash/broken_bridge_plank.png" id="9_plank"]
[ext_resource type="Texture2D" path="res://Assets/Props/DryWash/broken_bridge_beam.png" id="10_beam"]
[ext_resource type="Texture2D" path="res://Assets/Props/DryWash/bridge_support_pier.png" id="11_pier"]
[ext_resource type="Texture2D" path="res://Assets/Props/DryWash/test_bridge_segment.png" id="12_bridge_segment"]
[ext_resource type="Texture2D" path="res://Assets/Props/DryWash/clipboard_bridge_plan.png" id="13_clipboard"]
[ext_resource type="Texture2D" path="res://Assets/Props/DryWash/measuring_tape.png" id="14_tape"]
[ext_resource type="Texture2D" path="res://Assets/Props/DryWash/rope_coil.png" id="15_rope"]
[ext_resource type="Texture2D" path="res://Assets/Props/DryWash/monsoon_warning_sign.png" id="16_sign"]
[ext_resource type="Texture2D" path="res://Assets/Props/DryWash/rock_pile_wash_stones.png" id="17_rocks"]

[sub_resource type="CircleShape2D" id="CircleShape2D_player"]
radius = 18.0

[sub_resource type="RectangleShape2D" id="RectangleShape2D_exit"]
size = Vector2(220, 72)

[sub_resource type="RectangleShape2D" id="RectangleShape2D_station"]
size = Vector2(180, 96)

[sub_resource type="RectangleShape2D" id="RectangleShape2D_inspect"]
size = Vector2(140, 86)

[node name="DryWash" type="Node2D"]
script = ExtResource("1_region")
region_id = "dry_wash"
layout_path = "res://Data/layouts/dry_wash.json"

[node name="Background" type="Polygon2D" parent="."]

[node name="FarBank" type="Polygon2D" parent="."]

[node name="NearBank" type="Polygon2D" parent="."]

[node name="WashChannel" type="Sprite2D" parent="."]
texture_filter = 1
texture = ExtResource("8_channel")

[node name="WarningSign" type="Sprite2D" parent="."]
texture_filter = 1
texture = ExtResource("16_sign")

[node name="RockPileA" type="Sprite2D" parent="."]
texture_filter = 1
texture = ExtResource("17_rocks")

[node name="RockPileB" type="Sprite2D" parent="."]
texture_filter = 1
texture = ExtResource("17_rocks")

[node name="MrChenNpc" parent="." instance=ExtResource("4_mrchen")]

[node name="BrokenPlanksInspectable" type="Area2D" parent="."]
script = ExtResource("7_inspect")
inspect_id = "dry_wash_broken_planks"
quest_id = "bridge_quest_1"
objective_id = "inspect_planks"
prompt_text = "Inspect planks"
observation_text = "The planks snapped where flood force lifted and twisted the bridge deck."
notebook_tag = "bridge_damage"
once_only = true

[node name="Sprite" type="Sprite2D" parent="BrokenPlanksInspectable"]
texture_filter = 1
texture = ExtResource("9_plank")

[node name="CollisionShape2D" type="CollisionShape2D" parent="BrokenPlanksInspectable"]
shape = SubResource("RectangleShape2D_inspect")

[node name="BrokenBeamsInspectable" type="Area2D" parent="."]
script = ExtResource("7_inspect")
inspect_id = "dry_wash_broken_beams"
quest_id = "bridge_quest_1"
objective_id = "inspect_beams_supports"
prompt_text = "Inspect beams"
observation_text = "The beams shifted because the supports were not carrying force into stable ground."
notebook_tag = "bridge_damage"
once_only = true

[node name="Sprite" type="Sprite2D" parent="BrokenBeamsInspectable"]
texture_filter = 1
texture = ExtResource("10_beam")

[node name="CollisionShape2D" type="CollisionShape2D" parent="BrokenBeamsInspectable"]
shape = SubResource("RectangleShape2D_inspect")

[node name="AssessBridgeStation" type="Area2D" parent="."]
script = ExtResource("6_station")
quest_id = "bridge_quest_1"
objective_ids = Array[String](["talk_to_mr_chen", "visit_broken_bridge", "return_report"])
prompt_text = "Assess bridge"
completion_message = "Zuzu records the broken bridge visit and reports the damage pattern to Mr. Chen."
completion_tone = "warm"

[node name="CollisionShape2D" type="CollisionShape2D" parent="AssessBridgeStation"]
shape = SubResource("RectangleShape2D_station")

[node name="StationMat" type="Polygon2D" parent="AssessBridgeStation"]

[node name="Beacon" type="Polygon2D" parent="AssessBridgeStation"]

[node name="Sign" type="Label" parent="AssessBridgeStation"]
text = "Damage Review"
horizontal_alignment = 1
theme_override_font_sizes/font_size = 12

[node name="Prompt" type="Label" parent="AssessBridgeStation"]
text = "Assess bridge"
horizontal_alignment = 1

[node name="BridgeBuildStation" type="Area2D" parent="."]
script = ExtResource("6_station")
quest_id = "bridge_quest_4"
objective_ids = Array[String](["choose_design", "place_supports", "lay_planks", "secure_connections", "walk_test"])
prompt_text = "Build bridge"
completion_message = "Zuzu stages supports, planks, connections, and a careful walk-test across the dry wash."
completion_tone = "warm"

[node name="CollisionShape2D" type="CollisionShape2D" parent="BridgeBuildStation"]
shape = SubResource("RectangleShape2D_station")

[node name="StationMat" type="Polygon2D" parent="BridgeBuildStation"]

[node name="Beacon" type="Polygon2D" parent="BridgeBuildStation"]

[node name="Sign" type="Label" parent="BridgeBuildStation"]
text = "Bridge Build"
horizontal_alignment = 1
theme_override_font_sizes/font_size = 12

[node name="Prompt" type="Label" parent="BridgeBuildStation"]
text = "Build bridge"
horizontal_alignment = 1

[node name="BridgeReviewStation" type="Area2D" parent="."]
script = ExtResource("6_station")
quest_id = "bridge_quest_5"
objective_ids = Array[String](["talk_to_neighbors", "receive_badge", "unlock_new_area", "learn_triangles"])
prompt_text = "Review triangles"
completion_message = "Mr. Chen shows how triangles keep the rebuilt bridge from folding under load."
completion_tone = "warm"

[node name="CollisionShape2D" type="CollisionShape2D" parent="BridgeReviewStation"]
shape = SubResource("RectangleShape2D_station")

[node name="StationMat" type="Polygon2D" parent="BridgeReviewStation"]

[node name="Beacon" type="Polygon2D" parent="BridgeReviewStation"]

[node name="Sign" type="Label" parent="BridgeReviewStation"]
text = "Triangle Review"
horizontal_alignment = 1
theme_override_font_sizes/font_size = 12

[node name="Prompt" type="Label" parent="BridgeReviewStation"]
text = "Review"
horizontal_alignment = 1

[node name="SupportPierA" type="Sprite2D" parent="."]
texture_filter = 1
texture = ExtResource("11_pier")

[node name="SupportPierB" type="Sprite2D" parent="."]
texture_filter = 1
texture = ExtResource("11_pier")

[node name="TestBridgeSegment" type="Sprite2D" parent="."]
texture_filter = 1
texture = ExtResource("12_bridge_segment")

[node name="ClipboardPlan" type="Sprite2D" parent="."]
texture_filter = 1
texture = ExtResource("13_clipboard")

[node name="MeasuringTape" type="Sprite2D" parent="."]
texture_filter = 1
texture = ExtResource("14_tape")

[node name="RopeCoil" type="Sprite2D" parent="."]
texture_filter = 1
texture = ExtResource("15_rope")

[node name="BackToNeighborhood" type="Area2D" parent="."]
script = ExtResource("3_transition")
target_region = "neighborhood_street"
target_spawn = "from_dry_wash"
require_accept = false
feedback_message = "Zuzu rides back from the dry wash."

[node name="CollisionShape2D" type="CollisionShape2D" parent="BackToNeighborhood"]
shape = SubResource("RectangleShape2D_exit")

[node name="Prompt" type="Label" parent="BackToNeighborhood"]
text = "Neighborhood"
horizontal_alignment = 1

[node name="Player" type="CharacterBody2D" parent="."]
script = ExtResource("2_zuzu")

[node name="Sprite" type="AnimatedSprite2D" parent="Player"]
texture_filter = 1
position = Vector2(0, -32)
scale = Vector2(1.15, 1.15)
sprite_frames = ExtResource("5_zuzu_frames")
animation = &"idle_down"

[node name="CollisionShape2D" type="CollisionShape2D" parent="Player"]
shape = SubResource("CircleShape2D_player")

[node name="Camera2D" type="Camera2D" parent="Player"]
enabled = true
process_callback = 0
position_smoothing_enabled = true
```

---

## system_showcase - Projects 1-20 Showcase

Source: `BikeBrowserWorld\Regions\SystemShowcase\SystemShowcase.tscn`

```gdscene
[gd_scene load_steps=2 format=3 uid="uid://system_showcase_hub"]

[ext_resource type="Script" path="res://Regions/SystemShowcase/SystemShowcase.gd" id="1"]

[node name="SystemShowcase" type="Control"]
layout_mode = 3
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
script = ExtResource("1")
```
