const test = require('node:test');
const assert = require('node:assert/strict');

const { loadDashboard } = require('./helpers/load-dashboard');

function scalePrototype(proto) {
  return proto.vec.map(value => Math.round(value * 1023));
}

test('built-in dashboard self-tests pass', () => {
  const { hooks } = loadDashboard();
  const results = hooks.runLiveFsrSelfTests();

  assert.equal(results.ok, true, results.failures.join('\n'));
  assert.equal(results.failures.length, 0);
});

test('remap order matches the displayed zone labels', () => {
  const { hooks } = loadDashboard();
  const remapped = Array.from(hooks.remapRawFsrFrame([10, 20, 30, 40, 50, 60, 70, 80]));

  assert.deepEqual(remapped, [80, 70, 60, 50, 40, 30, 20, 10]);
  assert.deepEqual(Array.from(hooks.ZONE_NAMES), [
    'Back-Right',
    'Back-Left',
    'Hip-Right',
    'Thigh-Right',
    'Thigh-Left',
    'Hip-Left',
    'Front-Right',
    'Front-Left'
  ]);
});

test('predictPosture recognizes each prototype as the primary candidate', () => {
  const { hooks } = loadDashboard();

  hooks.POSTURE_PROTOTYPES.forEach(proto => {
    const result = hooks.predictPosture(scalePrototype(proto));
    assert.equal(result.primary.proto.id, proto.id);
    assert.ok(result.primary.score > 0.99);
  });
});

test('updatePostureSmoothed stabilizes after repeated frames and resets on empty input', () => {
  const { hooks } = loadDashboard();
  const postureState = hooks.createPostureState();
  const leanRight = hooks.predictPosture(scalePrototype(hooks.POSTURE_PROTOTYPES[1]));
  const empty = hooks.predictPosture(new Array(8).fill(0));

  let displayed = hooks.updatePostureSmoothed(postureState, leanRight);
  assert.equal(displayed, null);

  displayed = hooks.updatePostureSmoothed(postureState, leanRight);
  assert.equal(displayed.primary.proto.id, 'lean_right');

  displayed = hooks.updatePostureSmoothed(postureState, empty);
  assert.equal(displayed, null);
  assert.equal(postureState.currentId, null);
  assert.equal(postureState.pendingId, null);
  assert.equal(postureState.pendingTicks, 0);
});

test('onData updates stats and zone cards from the latest frame without waiting for the render loop', () => {
  const { hooks, document } = loadDashboard();
  const sampleFrame = [100, 200, 300, 400, 500, 600, 700, 800];

  hooks.onData({ timestamp: 1, fsr: sampleFrame });

  assert.equal(Number(document.getElementById('statAvg').textContent), 450);
  assert.equal(Number(document.getElementById('statPeak').textContent), 800);
  assert.equal(Number(document.getElementById('statAlerts').textContent), 1);
  assert.equal(Number(document.getElementById('zoneVal0').textContent), 100);
  assert.equal(Number(document.getElementById('zoneVal7').textContent), 800);
});

test('onData routes motors for confident postures and clears them on empty frames', () => {
  const { hooks } = loadDashboard();
  const leanForward = scalePrototype(hooks.POSTURE_PROTOTYPES.find(proto => proto.id === 'lean_forward'));

  for (let tick = 0; tick < hooks.POSTURE_PERSIST_TICKS + 2; tick++) {
    hooks.onData({ timestamp: tick, fsr: leanForward });
  }

  assert.deepEqual(Array.from(hooks.state.motors), Array.from(hooks.MOTOR_ROUTING.lean_forward.motors));
  assert.equal(hooks.state.motorReason, hooks.MOTOR_ROUTING.lean_forward.reason);

  hooks.onData({ timestamp: 99, fsr: new Array(8).fill(0) });

  assert.deepEqual(Array.from(hooks.state.motors), new Array(8).fill(0));
  assert.equal(hooks.state.motorReason, '');
});

test('SerialDataSource buffers partial frames and only emits complete transformed samples', () => {
  const { hooks } = loadDashboard();
  const captured = [];
  const source = new hooks.SerialDataSource(payload => captured.push(payload));

  source.buffer = '10,20,30,40,50,60,70,80\n1,2,3';
  source.processBuffer();

  assert.equal(captured.length, 1);
  assert.equal(source.buffer, '1,2,3');
  assert.ok(captured[0].fsr.every(value => Number.isInteger(value)));

  source.buffer += ',4,5,6,7,8\n';
  source.processBuffer();

  assert.equal(captured.length, 2);
  assert.equal(source.buffer, '');
});

test('FakeSessionDataSource emits software-only frames and stops cleanly', async () => {
  const { hooks } = loadDashboard();
  const captured = [];
  const source = new hooks.FakeSessionDataSource(payload => captured.push(payload));

  await source.start();
  await new Promise(resolve => setTimeout(resolve, 150));
  await source.stop();

  assert.equal(source.connected, false);
  assert.ok(captured.length >= 2);
  captured.forEach(sample => {
    assert.equal(sample.fsr.length, 8);
    sample.fsr.forEach(value => {
      assert.ok(Number.isInteger(value));
      assert.ok(value >= 0 && value <= 1023);
    });
  });
});

test('pressureToColor clamps out-of-range values to the gradient endpoints', () => {
  const { hooks } = loadDashboard();

  assert.equal(hooks.pressureToColor(-50), 'rgb(249,243,236)');
  assert.equal(hooks.pressureToColor(2048), 'rgb(122,22,40)');
});
