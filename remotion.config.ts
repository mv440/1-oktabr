import {Config} from '@remotion/cli/config';

// Barcha qismlar bir xil parametrlarda render qilinadi (1920x1080, 30 fps, H.264 + AAC).
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(16);
Config.setPixelFormat('yuv420p');
Config.setColorSpace('bt709');
Config.setAudioCodec('aac');
Config.setAudioBitrate('192k');
Config.setOverwriteOutput(true);
// Brauzer yo‘lini REMOTION_BROWSER orqali berish mumkin (masalan, oflayn muhitda).
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
