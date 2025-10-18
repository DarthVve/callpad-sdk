# Call termination

## Summary

We'd like to implement a process for call termination. The goal is to provide high level APIs for SDK clients to be able 
to provide call termination functionalities. We have two modes for call termination:

* leave call: This is a simple process that allows participants to leave a call.
* End call: This allows those with the right permission to be able to leave a call.


We need to support both approaches.

## Leave call

To leave a call, we can use the leave action in calls.service and useCallActions. This method should disconnect from the livekit room,
Then save then make an api call to the leave endpoint. Additionally, we should return the call ID, and also clear the state, so that UI will update.

### Open questions:
* How do we access the livekit room? Currently we have a useAutoConnectRoom(...) hook, how does this fit?

### End call

The end call follows a similar pattern as the leave call, except that it ends the call for everyone else too. 
We need to call the /end endpoint too, as we called /leave for the leave action. Note that we also need to return the call id + reset state here.
Ending the call for everyone else happens in the backend, when the /end endpoint is called.

### Open questions:
* How do we access the livekit room? Currently we have a useAutoConnectRoom(...) hook, how does this fit?

#### Graceful disconnect

We need to gracefully end the call for other participants in the call, after a call is ended. For this we need to 
provide a socket handler, with event called call:end event. In this command, we should simply call disconnect, 
and then clear state.


## Requirements

* Clean, simple, effective code. No unnecessary complexity.
* No unnecessary comments. 
* Think of a way we can keep things simple and extensible.

