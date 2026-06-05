import path from "path"
import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import { Session } from "@/session/session"
import { InstanceState } from "@/effect/instance-state"
import EXIT_DESCRIPTION from "./plan-exit.txt"

// kilocode_change start - simplified plan_exit: readiness signal only, no user prompt
export const Parameters = Schema.Struct({
  path: Schema.optional(
    Schema.String.annotate({
      description:
        "Optional path to the finalized plan file. Pass this when you saved the plan somewhere other than the provided plan file path.",
    }),
  ),
})

type Params = Schema.Schema.Type<typeof Parameters>

function display(input: { file: string; root: string }) {
  if (!path.isAbsolute(input.file)) return input.file
  const rel = path.relative(input.root, input.file)
  if (!rel.startsWith("..") && !path.isAbsolute(rel)) return rel
  return input.file
}

export const PlanExitTool = Tool.define(
  "plan_exit",
  Effect.gen(function* () {
    const session = yield* Session.Service

    return {
      description: EXIT_DESCRIPTION,
      parameters: Parameters,
      execute: (params: Params, ctx: Tool.Context) =>
        Effect.gen(function* () {
          const instance = yield* InstanceState.context
          const info = yield* session.get(ctx.sessionID)
          const file = params.path ?? Session.plan(info, instance)
          const plan = display({ file, root: instance.worktree })
          return {
            title: "Planning complete",
            output: `Plan is ready at ${plan}. Ending planning turn.`,
            metadata: { plan },
          }
        }).pipe(Effect.orDie),
    }
  }),
)
// kilocode_change end
