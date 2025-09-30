import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: './examples/absurd-worker.js',
  output: {
    filename: 'absurd-worker.bundle.js',
    path: path.join(__dirname, 'examples')
  },
  mode: 'development',
  target: 'webworker',
  resolve: {
    extensions: ['.js'],
    fallback: {
      crypto: false,
      path: false,
      fs: false
    }
  }
};
