# State changes

I'd like to change the state of this sdk to support invite states. 

We'd like our state to support the following UI: packages/sdk/Screenshot 2025-10-16 at 19.22.32.png.

Basically,
* Users can be added to an existing call. After they're added, we should save the users in the state, and update their state as event about their invite status comes to us.
* SDK clients should be able to use this state by using useOutgoingInvites(). This hook should provide the invites, the user info, and their current statuses.

## Context

* The invite endpoint now returns a few information:
  * The list of participants
  * The joinInfo (livekit token and url)
* AFter we call invite, we should basically populate the state with the invite list and joininfo.

* The accept response now also includes the joinInfo, so we should also save that to state when we accept a call.

# Requireements
* Keep it super simple. Dont overcomplicate it.
* No unnecessary comments.
* We need to support the state needed to build the provided UI.
