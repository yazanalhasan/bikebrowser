extends Node

# CANONICAL RUNTIME SYSTEM
# This is the authoritative first-loop gameplay inventory manager.
# Generated inventory addons are library/demo systems unless bridged here.

var items: Dictionary = {
	"wrench": { "quantity": 1, "kind": "tool" },
	"chain_lube": { "quantity": 1, "kind": "tool" }
}

func has_item(item_id: String) -> bool:
	return items.has(item_id) and int(items[item_id].get("quantity", 0)) > 0

func add_item(item_id: String, quantity: int = 1, kind: String = "item") -> void:
	var entry: Dictionary = items.get(item_id, { "quantity": 0, "kind": kind })
	entry["quantity"] = int(entry.get("quantity", 0)) + quantity
	entry["kind"] = kind
	items[item_id] = entry
	EventBus.emit_game_event("inventory_changed", { "itemId": item_id, "quantity": entry["quantity"] })

func serialize() -> Dictionary:
	return items
