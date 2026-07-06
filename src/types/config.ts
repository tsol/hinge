/** Agent script paths — each is an absolute or relative path to a shell script */
export interface AgentScripts {
  new_session: string     // receives prompt on stdin, alias as $1, outputs response on stdout
  continue_session: string // receives message on stdin, alias as $1, outputs response
  wrapper: string         // internal — spawned by server, calls new_session/continue_session, does cleanup
}
