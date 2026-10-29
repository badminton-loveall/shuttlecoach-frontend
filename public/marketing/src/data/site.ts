export const APP_URL = "https://app.loveall.in";
export const CONTACT_EMAIL = "hello@loveall.in";

export const nameLine = "Every great match begins at Love all. So does every great player.";

export const taglines = [
"Every champion starts at Love all.",
"Structure, for the love of the game.",
"Train with intent. Begin at Love all."];


export const images = {
  coachJunior: {
    src: "/cb28ae56-a9a2-4213-8491-862f3f56e6e7.jpg",
    alt: "A head coach crouches beside a junior player, adjusting the grip on his racket on a wooden badminton court.",
    width: 1200,
    height: 900
  },
  footworkDrill: {
    src: "/c6ad8267-bb55-43d6-b388-88c9396b840a.jpg",
    alt: "Junior players run a footwork drill between cones on the court lines while a coach watches.",
    width: 1200,
    height: 800
  },
  shuttle: {
    src: "/95cbd237-ce88-4e6b-aa60-76ca2c975e3c.jpg",
    alt: "A white feather shuttlecock resting on the line of a wooden badminton court.",
    width: 960,
    height: 1200
  },
  veteranCoach: {
    src: "/df0cb013-647b-427e-8b69-3534ae6cb0aa.jpg",
    alt: "A senior badminton coach holding a clipboard stands courtside in a sunlit academy hall.",
    width: 960,
    height: 1200
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
  url: "https://loveall.in",
  logo: "https://loveall.in/logo.png",
  email: CONTACT_EMAIL,
  areaServed: "IN",
  slogan: taglines[0]
},
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LoveAll",
  url: "https://loveall.in",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Sports academy training management",
  operatingSystem: "Web browser",
  description:
  "The training management platform for badminton academies: players, batches, 8-week training plans, assessments, attendance and fees in one place.",
  audience: { "@type": "Audience", audienceType: "Badminton academies and coaches" }
}];