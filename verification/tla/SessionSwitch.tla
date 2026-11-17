--------------------------- MODULE SessionSwitch ---------------------------
EXTENDS Naturals

CONSTANTS EpochLimit, RequestSlots, AcceptStaleResponses
VARIABLES epoch, active, pending, visible

vars == <<epoch, active, pending, visible>>
Accounts == {"admin", "member"}
Surfaces == {"notes", "admin"}
Slots == 1..RequestSlots
Sessions == [account : Accounts, generation : 1..EpochLimit]
Responses == [session : Sessions, surface : Surfaces]
NoSession == [account |-> "none", generation |-> 0]
NoResponse == [session |-> NoSession, surface |-> "none"]

Init ==
    /\ epoch = 0
    /\ active = NoSession
    /\ pending = [slot \in Slots |-> NoResponse]
    /\ visible = NoResponse

SignIn(account) ==
    /\ active = NoSession
    /\ epoch < EpochLimit
    /\ epoch' = epoch + 1
    /\ active' = [account |-> account, generation |-> epoch']
    /\ UNCHANGED <<pending, visible>>

SignOut ==
    /\ active # NoSession
    /\ active' = NoSession
    /\ visible' = NoResponse
    /\ UNCHANGED <<epoch, pending>>

StartRequest(slot, surface) ==
    /\ active # NoSession
    /\ surface = "notes" \/ active.account = "admin"
    /\ pending[slot] = NoResponse
    /\ pending' = [pending EXCEPT ![slot] = [session |-> active, surface |-> surface]]
    /\ UNCHANGED <<epoch, active, visible>>

FinishRequest(slot) ==
    LET response == pending[slot] IN
    /\ response # NoResponse
    /\ pending' = [pending EXCEPT ![slot] = NoResponse]
    /\ visible' = IF active # NoSession /\ (AcceptStaleResponses \/ response.session = active)
                  THEN response
                  ELSE visible
    /\ UNCHANGED <<epoch, active>>

Next ==
    \/ \E account \in Accounts : SignIn(account)
    \/ SignOut
    \/ \E slot \in Slots, surface \in Surfaces : StartRequest(slot, surface)
    \/ \E slot \in Slots : FinishRequest(slot)

Spec == Init /\ [][Next]_vars

TypeOK ==
    /\ epoch \in 0..EpochLimit
    /\ active \in Sessions \cup {NoSession}
    /\ pending \in [Slots -> Responses \cup {NoResponse}]
    /\ visible \in Responses \cup {NoResponse}

VisibleDataBelongsToActiveSession ==
    visible = NoResponse \/ (active # NoSession /\ visible.session = active)

AdminDataRequiresAdmin ==
    visible.surface = "admin" => active.account = "admin"

=============================================================================
