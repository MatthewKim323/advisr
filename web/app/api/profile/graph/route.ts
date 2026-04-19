import { NextResponse } from "next/server";
import {
  hasSupabase,
  DEMO_STUDENT_ID,
  supabaseServiceRoleKey,
} from "@/lib/utils/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GraphNode {
  id: string;
  label: string;
  kind: string;
  /** Populated for source-file nodes so the client can open/trigger callbacks. */
  sourceFileId?: string;
}
interface GraphEdge {
  source: string;
  target: string;
  predicate: string;
  weight?: number;
}

/**
 * Returns a 2D force-graph snapshot of the student's knowledge constellation.
 *
 * Two node layers:
 *   1. Entities + relationships — actual semantic graph (once populated).
 *   2. Source-file nodes — one node per uploaded file. Always present so the
 *      KnowledgeConstellation has something interactive even pre-extraction.
 *      Each is wired to a "student" anchor node with a synthetic `authored`
 *      or `received` edge, tagged by file kind.
 *
 * Uses the service-role Supabase client when available (service role key in
 * env) so we can read across RLS. Falls back to anon client otherwise; if
 * neither is reachable we return an empty graph rather than throwing.
 */
export async function GET(req: Request) {
  const studentId =
    new URL(req.url).searchParams.get("studentId") ?? DEMO_STUDENT_ID;

  if (!hasSupabase()) {
    return NextResponse.json({ nodes: [], links: [] });
  }

  try {
    const supabase = await getSupabase();
    const [entRes, relRes, fileRes] = await Promise.all([
      supabase.from("entities").select("id, kind, canonical_name").limit(200),
      supabase
        .from("relationships")
        .select("from_entity_id, to_entity_id, predicate, weight")
        .eq("student_id", studentId)
        .limit(400),
      supabase
        .from("source_files")
        .select("id, kind, filename")
        .eq("student_id", studentId)
        .limit(100),
    ]);

    const entityNodes: GraphNode[] = (entRes.data ?? []).map(
      (e: { id: string; kind: string; canonical_name: string }) => ({
        id: `entity:${e.id}`,
        label: e.canonical_name,
        kind: e.kind,
      }),
    );

    const fileNodes: GraphNode[] = (fileRes.data ?? []).map(
      (f: { id: string; kind: string; filename: string }) => ({
        id: `file:${f.id}`,
        label: prettyFilename(f.filename),
        kind: `file:${f.kind}`,
        sourceFileId: f.id,
      }),
    );

    const entityIds = new Set(entityNodes.map((n) => n.id));

    const entLinks: GraphEdge[] = (relRes.data ?? [])
      .map(
        (r: {
          from_entity_id: string;
          to_entity_id: string;
          predicate: string;
          weight?: number;
        }) => ({
          source: `entity:${r.from_entity_id}`,
          target: `entity:${r.to_entity_id}`,
          predicate: r.predicate,
          weight: r.weight ?? 1,
        }),
      )
      .filter((l) => entityIds.has(l.source) && entityIds.has(l.target));

    // Synthetic student-anchor so file nodes have somewhere to land.
    const anchor: GraphNode = {
      id: "anchor:student",
      label: "Student",
      kind: "anchor",
    };

    const fileLinks: GraphEdge[] = fileNodes.map((n) => ({
      source: anchor.id,
      target: n.id,
      predicate: "derived-from",
      weight: 0.5,
    }));

    const nodes: GraphNode[] =
      fileNodes.length > 0 || entityNodes.length > 0
        ? [anchor, ...entityNodes, ...fileNodes]
        : [];

    return NextResponse.json({ nodes, links: [...entLinks, ...fileLinks] });
  } catch (err) {
    console.error("[graph] fetch failed:", err);
    return NextResponse.json({ nodes: [], links: [] });
  }
}

async function getSupabase() {
  const serviceKey = supabaseServiceRoleKey();
  if (serviceKey) {
    const { createClient } = await import("@supabase/supabase-js");
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  const { createClient } = await import("@/lib/supabase/server");
  return createClient();
}

function prettyFilename(s: string): string {
  return s.replace(/^\d+_/, "").replace(/\.[a-z0-9]+$/i, "").replace(/_/g, " ");
}
