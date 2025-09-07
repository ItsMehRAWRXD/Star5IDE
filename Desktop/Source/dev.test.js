const { spawn } = require('child_process');
const fs = require('fs');

describe('Dev Script Tests', () => {
  test('should have dev script in package.json', () => {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    expect(packageJson.scripts.dev).toBe('nodemon src/app.js');
  });

  test('should start nodemon process', (done) => {
    const child = spawn('npm', ['run', 'dev'], { stdio: 'pipe' });

    child.stdout.on('data', (data) => {
      if (data.toString().includes('Server running')) {
        child.kill();
        done();
      }
    });

    setTimeout(() => {
      child.kill();
      done(new Error('Timeout'));
    }, 5000);
  });

  test('should restart on file changes', (done) => {
    const child = spawn('npm', ['run', 'dev'], { stdio: 'pipe' });
    
    child.stdout.on('data', (data) => {
      if (data.toString().includes('restarting')) {
        child.kill();
        done();
      }
    });

    setTimeout(() => {
      fs.writeFileSync('test.js', '// change');
      setTimeout(() => fs.unlinkSync('test.js'), 1000);
    }, 2000);

    setTimeout(() => {
      child.kill();
      done(new Error('No restart detected'));
    }, 6000);
  });
});