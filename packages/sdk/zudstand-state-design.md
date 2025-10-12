# Zudstand State Design

We want to implement zudstand state for our SDK. The requirements are:

* Allow SDK clients to detect an incoming call session
* Allow SDK clients to know the current state of the call session (and null if no call is active)
* Allow SDK clients to end a call. On ending a call, the session should cleared from the SDK state. 
* On appropriate API requests & events (SocketIO), we should update the SDK state.
* Our state should cater for both inbound and outbound calls, with clear separation, so we can use it to show appropriate UIs.


## References

* The service doc is in /Users/office/VoyatekGroup/go-callpad/callpad/apps/signal/docs/signal-service.md. Check it to understand the flows for events/api requests.
* 