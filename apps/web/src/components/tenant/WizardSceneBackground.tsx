import type { ReactNode } from "react";

/** Playful fullscreen backdrop for wizards — Stadium-style stickers in Shelf Merch colors. */
export function WizardSceneBackground({ children }: { children: ReactNode }) {
  return (
    <div className="sm-wizard-scene">
      <div className="sm-wizard-scene__decor" aria-hidden>
        <span className="sm-wizard-scene__sticker swag">Swag</span>
        <span className="sm-wizard-scene__sticker kudos">Kudos</span>
        <span className="sm-wizard-scene__sticker star star-a">★</span>
        <span className="sm-wizard-scene__sticker star star-b">★</span>
        <span className="sm-wizard-scene__sticker star star-c">★</span>
        <span className="sm-wizard-scene__sticker plus plus-a">+</span>
        <span className="sm-wizard-scene__sticker plus plus-b">+</span>
        <span className="sm-wizard-scene__sticker gift" />
        <span className="sm-wizard-scene__sticker bubble">You&apos;re amazing</span>
        <span className="sm-wizard-scene__sticker ring" />
      </div>
      <div className="sm-wizard-scene__content">{children}</div>
    </div>
  );
}
