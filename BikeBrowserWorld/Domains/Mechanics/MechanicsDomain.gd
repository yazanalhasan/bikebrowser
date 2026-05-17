extends Node

const DOMAIN_ID := "mechanics"

func register_domain() -> Dictionary:
	return {
		"id": DOMAIN_ID,
		"title": "Bike Mechanics",
		"active": true,
		"simulationTypes": ["chain_hotspot_inspection"],
		"questIds": ["chain_repair"]
	}
