export interface VoiceProfile {
  id: string;
  name: string;
  gender: 'female' | 'male';
  description: string;
  badge: string;
  avatarSeed: string; // Used to display a cute avatar
  recommendedTone: string;
}

export interface VoiceoverSettings {
  text: string;
  voiceName: string;
  gender: 'female' | 'male';
  tone: string;
}

export interface GeneratedVoiceover {
  audioUrl: string;
  rawBase64: string;
  voiceName: string;
  gender: 'female' | 'male';
  tone: string;
  text: string;
  duration: number;
  createdAt: string;
}
