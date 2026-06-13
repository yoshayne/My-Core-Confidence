import { useEffect, useState } from "react";
import { Quote } from "lucide-react";
import AuthCard from "../components/AuthCard";
import type { StoryContent } from "../../../shared/types";

const DEFAULTS: StoryContent = {
  tagline: "Confidence isn't given, it's built.",
  tagline_highlight: "built.",
  subline: "Real training. Real results. No fluff. Just work that works.",
  hero_image: "",
  signature_image: "",
  founder_label: "FOUNDER · TRAINER",
  auth_title: "Your journey starts here.",
  auth_subtitle: "Create your account to start training.",
  story_title: "Donovan's",
  story_highlight: "Story.",
  story_text:
    "I didn't grow up with confidence. I built it—rep by rep, choice by choice. Fitness changed my life, and now my mission is to help you build a stronger body and an unshakable mindset.",
  story_image: "",
  quote: "The strongest version of you is already in there. Let's build it together.",
};

function splitHighlight(text: string, highlight: string) {
  if (!highlight || !text.includes(highlight)) {
    return { before: text, highlight: "", after: "" };
  }
  const idx = text.indexOf(highlight);
  return {
    before: text.slice(0, idx),
    highlight,
    after: text.slice(idx + highlight.length),
  };
}

export default function Landing() {
  const [story, setStory] = useState<StoryContent>(DEFAULTS);
  const [heroAspect, setHeroAspect] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/story");
        if (!res.ok) return;
        const data = (await res.json()) as StoryContent;
        if (!cancelled) setStory((s) => ({ ...s, ...data }));
      } catch {
        // keep defaults
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const tagline = splitHighlight(story.tagline, story.tagline_highlight);
  const storyHeading = `${story.story_title} ${story.story_highlight}`.trim();
  const storyTitle = splitHighlight(storyHeading, story.story_highlight);

  return (
    <div className="min-h-screen bg-bg px-4 py-8 lg:px-8 lg:py-12">
      <div className="mx-auto flex max-w-md flex-col gap-10 lg:max-w-6xl lg:gap-16">
        {/* Hero + Auth */}
        <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <div
              className={`relative w-full overflow-hidden rounded-card bg-bg-raise ${
                heroAspect ? "" : "aspect-[4/5] lg:aspect-[4/3]"
              }`}
              style={heroAspect ? { aspectRatio: heroAspect } : undefined}
            >
              {story.hero_image && (
                <img
                  src={story.hero_image}
                  alt=""
                  className="h-full w-full object-cover"
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (img.naturalWidth > img.naturalHeight) {
                      setHeroAspect(img.naturalWidth / img.naturalHeight);
                    }
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/10 to-bg/40" />

              <h1 className="absolute left-4 top-5 max-w-[75%] text-[28px] font-extrabold leading-tight tracking-tight text-text sm:text-[34px] lg:left-6 lg:top-6 lg:text-[40px]">
                {tagline.before}
                <span className="text-blue">{tagline.highlight}</span>
                {tagline.after}
              </h1>

              {(story.signature_image || story.founder_label) && (
                <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1 lg:bottom-6 lg:right-6">
                  {story.signature_image && (
                    <img src={story.signature_image} alt="Donovan's signature" className="h-10" />
                  )}
                  {story.founder_label && (
                    <span className="text-[10px] font-bold tracking-[0.2em] text-text-secondary">
                      {story.founder_label}
                    </span>
                  )}
                </div>
              )}
            </div>

            <p className="mt-4 text-sm text-text-secondary">{story.subline}</p>
          </div>

          <div className="flex justify-center lg:justify-start">
            <AuthCard title={story.auth_title} subtitle={story.auth_subtitle} />
          </div>
        </div>

        {/* Story + Quote */}
        <div className="flex flex-col gap-10 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold lg:text-2xl">
                {storyTitle.before}
                <span className="text-blue">{storyTitle.highlight}</span>
                {storyTitle.after}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{story.story_text}</p>
            </div>
            {story.story_image && (
              <img
                src={story.story_image}
                alt=""
                className="h-28 w-28 flex-shrink-0 rounded-card object-cover lg:h-40 lg:w-40"
              />
            )}
          </div>

          <div className="rounded-card border border-card-border bg-card p-6 lg:p-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue">
              <Quote className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <p className="mt-4 text-lg font-semibold leading-snug text-text lg:text-xl">{story.quote}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
