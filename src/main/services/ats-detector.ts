export type ATSPlatform =
  | 'greenhouse'
  | 'lever'
  | 'workday'
  | 'icims'
  | 'taleo'
  | 'bamboohr'
  | 'smartrecruiters'
  | 'ashby'
  | 'unknown';

const ATS_PATTERNS: Record<ATSPlatform, string[]> = {
  greenhouse: ['boards.greenhouse.io', 'grnh.se', 'greenhouse.io/'],
  lever: ['jobs.lever.co', 'lever.co/'],
  workday: ['myworkdayjobs.com', 'wd5.myworkdayjobs.com', 'myworkday.com'],
  icims: ['icims.com', 'careers-'],
  taleo: ['taleo.net', 'oracle.com/careers'],
  bamboohr: ['bamboohr.com/careers', 'bamboohr.com/jobs'],
  smartrecruiters: ['smartrecruiters.com/'],
  ashby: ['ashbyhq.com', 'jobs.ashbyhq.com'],
  unknown: [],
};

export function detectATS(url: string): ATSPlatform {
  const lowerUrl = url.toLowerCase();
  for (const [platform, patterns] of Object.entries(ATS_PATTERNS)) {
    if (platform === 'unknown') continue;
    for (const pattern of patterns) {
      if (lowerUrl.includes(pattern)) {
        return platform as ATSPlatform;
      }
    }
  }
  return 'unknown';
}

export function getATSDisplayName(platform: ATSPlatform): string {
  const names: Record<ATSPlatform, string> = {
    greenhouse: 'Greenhouse',
    lever: 'Lever',
    workday: 'Workday',
    icims: 'iCIMS',
    taleo: 'Taleo / Oracle',
    bamboohr: 'BambooHR',
    smartrecruiters: 'SmartRecruiters',
    ashby: 'Ashby',
    unknown: 'Unknown Platform',
  };
  return names[platform];
}
