/**
 * F4 — student brief PDF.
 *
 * Server-side @react-pdf/renderer. Nami's one-page counselor-quality summary
 * students hand to admissions folks, scholarship committees, or their parents.
 *
 * Typography: Silkscreen at 9pt for section headers, a neutral sans for body.
 * Height-budgeted to one US Letter page at 11pt body.
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { ProfileSummary } from "@/lib/graph/profile";

// Register Silkscreen once. @react-pdf accepts remote URLs.
// Kept lazy — registration is a no-op on subsequent calls.
try {
  Font.register({
    family: "Silkscreen",
    src: "https://fonts.gstatic.com/s/silkscreen/v5/m8JXjfVPf62XiF7kO-i9ULRvamODxdI.ttf",
  });
} catch {
  // Double-register in hot reload — ignore.
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingHorizontal: 44,
    paddingBottom: 36,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    lineHeight: 1.45,
    color: "#12202a",
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#12202a",
    paddingBottom: 8,
    marginBottom: 14,
  },
  brand: {
    fontFamily: "Silkscreen",
    fontSize: 10,
    letterSpacing: 2,
    color: "#b07527",
  },
  title: {
    fontSize: 22,
    marginTop: 4,
    color: "#12202a",
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  section: {
    marginTop: 12,
  },
  sectionHeader: {
    fontFamily: "Silkscreen",
    fontSize: 8.5,
    letterSpacing: 2,
    color: "#b07527",
    marginBottom: 4,
  },
  listItem: {
    marginBottom: 2,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 44,
    right: 44,
    fontSize: 8,
    color: "#999",
    borderTopWidth: 0.5,
    borderTopColor: "#ccc",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export interface StudentBriefProps {
  profile: ProfileSummary;
  generatedAt?: Date;
}

export function StudentBriefDocument({
  profile,
  generatedAt = new Date(),
}: StudentBriefProps) {
  const dateStr = generatedAt.toISOString().slice(0, 10);
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>NAMI · STUDENT BRIEF</Text>
          <Text style={styles.title}>
            {profile.displayName ?? "Student"}
          </Text>
          <Text style={styles.subtitle}>
            Receipts on record · {profile.claimCounts.confirmed} confirmed claims
            · generated {dateStr}
          </Text>
        </View>

        <Section header="Academic">
          <BulletList items={profile.academic} emptyNote="no academic claims on record" />
        </Section>

        <Section header="Activities">
          <BulletList items={profile.activities} emptyNote="no activities on record" />
        </Section>

        <Section header="Themes the student has voiced">
          <BulletList
            items={profile.themes}
            emptyNote="no themes extracted yet"
          />
        </Section>

        <Section header="Financial context">
          <BulletList items={profile.financial} emptyNote="no financial claims on record" />
        </Section>

        <Section header="Schools of interest">
          <BulletList items={profile.schools} emptyNote="no schools on record" />
        </Section>

        <View style={styles.footer}>
          <Text>nami · counselor-quality, receipt-grounded</Text>
          <Text>every claim links to a source chunk</Text>
        </View>
      </Page>
    </Document>
  );
}

function Section({
  header,
  children,
}: {
  header: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>{header.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function BulletList({
  items,
  emptyNote,
}: {
  items: string[];
  emptyNote: string;
}) {
  if (items.length === 0) {
    return (
      <Text style={{ color: "#999", fontStyle: "italic" }}>— {emptyNote}</Text>
    );
  }
  return (
    <View>
      {items.map((it, i) => (
        <Text key={i} style={styles.listItem}>
          • {it}
        </Text>
      ))}
    </View>
  );
}
