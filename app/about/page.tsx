import { getAboutValues, getAboutEcosystem, getAboutContent, getMarqueeItems, getMilestones, getSetting } from "@/lib/queries";
import { AboutClient } from "@/components/AboutClient";

export const revalidate = 60;

export const metadata = {
  title: "About Big Quiv | From a shop floor in Lagos to systems that ship",
  description:
    "Microbiologist, then a sales boy on ₦10,000 a month. Now: Ophir Digital Education Foundation (CAC 9071886), over 2,000 students trained, and ten production systems deployed.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const [values, ecosystem, content, marqueeItems, milestones, calendlyUrl] = await Promise.all([
    getAboutValues(),
    getAboutEcosystem(),
    getAboutContent(),
    getMarqueeItems("about"),
    getMilestones(),
    getSetting("calendly_url"),
  ]);

  return (
    <AboutClient
      content={content}
      values={values}
      ecosystem={ecosystem}
      marqueeItems={marqueeItems}
      milestones={milestones}
      calendlyUrl={calendlyUrl}
    />
  );
}
