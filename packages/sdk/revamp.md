# Revamp

We need to revamp a few things in the SDK. 

## API changes

The current API we use for call flows (initiate, send invites, etc) have all changed drastically. The responses are now very very slim.
Notably: 

* we don't return the user info in the response anymore. We return user Ids now. we need to "hydrate" the user info now.
* We now have two separate endponts for the initial call initiation and in-call invites. 
* We have more endpoints now, like mute, kick, etc, so we need to integrate that in the call service + call actions.
* There's no leave endpoint anymore, in it's place, there's now an end action. We have to design a new way to leave calls. Notably, end is for call hosts, to now leave a call, we need to call room.disconnect()


### User info hydration

We need to setup a sort of "participant profile cache" that has a simple public api: add(Array<profiles>), get(id) - that does a few things.
at anytime, we can use the add method to add profiles to the cache, and at anytime, we can get the profile. If we "get", and the profile is in cache, we return it, else we make an api request to the participant profile endpoint.
the endpoint for the profile fetch now exist in the generated type. Both initiate + sendInvites now return a `participants` field that contains a list of participant infos. On successful execution of those endpoints, we should immediatly 
add the profiles to cache before we move forward. This ensures any further operations have access to the profiles.

Also note that a new socketio event has been added that returns profiles (called participant:profile). At any point in time, we can get new profiles, so this event handler should basically update the cache.

#### Notable questions

* should we keep the profiles in zudstand or a simple object?


## Call termination flows

Currently, we have a leave action that calls a singular leave endpoint, and then calls disconnect and clears state. This has to change now.

The current leave endpoint is used by all types of roles, and backend decides what to do based on role. 

### New termination flow

The new termination flow should simply work this way:
* We should provide the current leave endpoint still. When this is called, we simply call room.disconnect, and then reset the state.
* We should also provide an additional end endpoint still. This will be used by HOST roles, to terminate the call for everyone.


## New Socket IO events

The socketIO events have also changed drastically. The payloads are now very different, and we should make a plan for this;

We should add new handlers that don't currently exist, and then remove deprecated/stale ones. We should update state as necessary here,
Let's make a detailed plan/design for this also. 

Let's think about the entire call flows also and ensure we are implementing things correctly. 


## Context

* Note that the new socket-io and and api client have been generated. 
* Given the new current endpoints/socketio events, we need to establish an efficient call flow, from initiation to answering to ending. 
* The backend for the api is at /Users/office/VoyatekGroup/go-callpad/callpad/apps/signal/src
