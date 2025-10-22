import request from 'supertest';
import expressApp from '../src/app';

describe('Backend API', () => {
  it('GET /health responds ok', async () => {
    const res = await request(expressApp).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /v1/ci/status returns CI state', async () => {
    const res = await request(expressApp).get('/v1/ci/status');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('build');
    expect(res.body).toHaveProperty('tests');
    expect(res.body).toHaveProperty('logsRef');
  });

  it('GET /v1/system/metrics returns system metrics', async () => {
    const res = await request(expressApp).get('/v1/system/metrics');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('cpu');
    expect(res.body).toHaveProperty('memory');
    expect(res.body).toHaveProperty('battery');
    expect(res.body).toHaveProperty('network');
  });

  it('GET /v1/security/status returns security state', async () => {
    const res = await request(expressApp).get('/v1/security/status');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('vpn');
  });

  it('GET /v1/network/flows returns flows', async () => {
    const res = await request(expressApp).get('/v1/network/flows');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.flows)).toBe(true);
  });

  it('GET /v1/logs/stream returns logs', async () => {
    const res = await request(expressApp).get('/v1/logs/stream?limit=5');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.logs)).toBe(true);
  });

  it('POST /v1/llm/explain returns explanation', async () => {
    const res = await request(expressApp)
      .post('/v1/llm/explain')
      .send({ context: 'ci-failure', data: { logsRef: 'ci/main#1' } });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('explanation');
  });

  it('POST /v1/commands/execute (dryRun) returns preview', async () => {
    const res = await request(expressApp)
      .post('/v1/commands/execute')
      .send({ commandId: 'restart-dev', dryRun: true });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('preview');
  });
});
