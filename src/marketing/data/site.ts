import { SITE_URL } from "../utils/meta";

export const APP_URL = "/login";
export const CONTACT_EMAIL = "info@loveall.co.in";

/** LoveAll's WhatsApp, in international format without "+" (as wa.me needs). */
export const WHATSAPP_NUMBER = "919972151617";
export const WHATSAPP_DISPLAY = "+91 99721 51617";

/**
 * WhatsApp click-to-chat link (https://wa.me/<number>?text=...). Opens a chat
 * with LoveAll with the message already typed; the visitor taps Send.
 */
export function whatsappUrl(text?: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export const nameLine = "Every great match begins at Love all. So does every great player.";

export const taglines = [
"Every champion starts at Love all.",
"Structure, for the love of the game.",
"Train with intent. Begin at Love all."];


export const images = {
  coachJunior: {
    src: "/coach-with-junior.jpg",
    alt: "A head coach crouches beside a junior player, adjusting the grip on his racket on a wooden badminton court.",
    width: 1200,
    height: 896
  },
  footworkDrill: {
    src: "/footwork-drill.jpg",
    alt: "Junior players run a footwork drill between cones on the court lines while a coach watches.",
    width: 1264,
    height: 848
  },
  shuttle: {
    src: "/shuttle-on-court.jpg",
    alt: "A white feather shuttlecock resting on the line of a wooden badminton court.",
    width: 928,
    height: 1152
  },
  veteranCoach: {
    src: "/veteran-coach.jpg",
    alt: "A senior badminton coach holding a clipboard stands courtside in a sunlit academy hall.",
    width: 928,
    height: 1152
  }
};

export const socialLinks = [
{ label: "Instagram", href: "https://www.instagram.com/loveall.in" },
{ label: "LinkedIn", href: "https://www.linkedin.com/company/loveall-in" },
{ label: "YouTube", href: "https://www.youtube.com/@loveall-in" }];


export const structuredData = [
{
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "LoveAll",
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512.png`,
  email: CONTACT_EMAIL,
  areaServed: "IN",
  slogan: taglines[0]
},
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LoveAll",
  url: SITE_URL,
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Sports academy training management",
  operatingSystem: "Web browser",
  description:
  "The training management platform for badminton academies: players, batches, 8-week training plans, assessments, attendance and fees in one place.",
  audience: { "@type": "Audience", audienceType: "Badminton academies and coaches" }
}];