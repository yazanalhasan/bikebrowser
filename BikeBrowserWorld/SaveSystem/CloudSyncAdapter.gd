extends Node
class_name CloudSyncAdapter

enum ConflictResult {
	NONE,
	LOCAL_NEWER,
	REMOTE_NEWER,
	SAME_TIMESTAMP
}

@export var save_manager_path: NodePath

func upload_save(slot: int) -> bool:
	push_warning("CloudSyncAdapter.upload_save is a stub. Connect this to your platform SDK.")
	return false

func download_save(slot: int) -> Dictionary:
	push_warning("CloudSyncAdapter.download_save is a stub. Connect this to your platform SDK.")
	return {}

func check_conflict(slot: int) -> int:
	var local_info := _get_local_info(slot)
	var remote_info := _get_remote_info(slot)
	if local_info.is_empty() or remote_info.is_empty():
		return ConflictResult.NONE

	var local_timestamp := str(local_info.get("timestamp", ""))
	var remote_timestamp := str(remote_info.get("timestamp", ""))
	if local_timestamp == remote_timestamp:
		return ConflictResult.SAME_TIMESTAMP
	if local_timestamp > remote_timestamp:
		return ConflictResult.LOCAL_NEWER
	return ConflictResult.REMOTE_NEWER

func resolve_conflict_latest_wins(slot: int) -> String:
	var result := check_conflict(slot)
	match result:
		ConflictResult.LOCAL_NEWER:
			upload_save(slot)
			return "uploaded_local"
		ConflictResult.REMOTE_NEWER:
			download_save(slot)
			return "downloaded_remote"
		ConflictResult.SAME_TIMESTAMP:
			return "already_synced"
		_:
			return "no_conflict"

func _get_local_info(slot: int) -> Dictionary:
	var save_manager: Node = null
	if save_manager_path != NodePath():
		save_manager = get_node_or_null(save_manager_path)
	else:
		save_manager = get_node_or_null("/root/SaveManager")
	if save_manager != null and save_manager.has_method("get_save_info"):
		return save_manager.get_save_info(slot)
	return {}

func _get_remote_info(slot: int) -> Dictionary:
	return {}
