extends Node

var http_client = HTTPClient.new()

func _ready():
    var error = http_client.connect_to_host(
        "vr40k.herokuapp.com",
        443,
        true
    )
    if error != OK:
        push_error("Failed to connect to server")

func upload_character(data: Dictionary) -> void:
    var headers = ["Content-Type: application/json"]
    var json_data = to_json(data)
    var body = PoolByteArray()
    body.append_array(json_data.to_utf8())
    
    var error = http_client.request_raw(
        http_client.get_request_headers(),
        PoolStringArray(),
        true,
        HTTPClient.METHOD_POST,
        "/upload-character",
        headers,
        body
    )
    
    if error != OK:
        push_error("Failed to send request")
