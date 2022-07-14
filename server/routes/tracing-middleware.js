'use strict';

const opentelemetryApi = require('@opentelemetry/api');

const { captureSpanProcessor } = require('../tracing/tracing');
const serializeSpan = require('../tracing/serialize-span');

// From the current active context, grab the `traceId`. The `traceId` will be
// shared for the whole request because all spans live under the root span.
function _getActiveTraceId() {
  //const rootCtx = opentelemetryApi.ROOT_CONTEXT;
  const activeCtx = opentelemetryApi.context.active();
  if (activeCtx) {
    const span = opentelemetryApi.trace.getSpan(activeCtx);
    if (span) {
      const traceId = span.spanContext().traceId;

      return traceId;
    }
  }
}

async function handleTracingMiddleware(req, res, next) {
  const traceId = _getActiveTraceId();
  if (traceId) {
    // Add the OpenTelemetry trace ID to the `X-Trace-Id` response header so
    // we can cross-reference. We can use this to lookup the request in
    // Jaeger.
    res.set('X-Trace-Id', traceId);

    // Start keeping track of all of spans that happen during the request
    captureSpanProcessor.trackSpansInTrace(traceId);

    // Cleanup after the request is done
    res.on('finish', function () {
      captureSpanProcessor.dropSpansInTrace(traceId);
    });
  }

  next();
}

// Get all of spans we're willing to show to the user.
//
// We only care about showing the external API HTTP requests to the user so they
// can tell what part of the Matrix API is being so slow.
function getSerializableSpans() {
  const traceId = _getActiveTraceId();
  if (traceId) {
    const spans = captureSpanProcessor.getSpansInTrace(traceId);

    // We only care about showing the external API HTTP requests to the user
    const filteredSpans = spans.filter((span) => {
      return span.instrumentationLibrary.name === '@opentelemetry/instrumentation-http';
    });

    const serializableSpans = filteredSpans.map((span) => serializeSpan(span));

    return serializableSpans;
  }

  return [];
}

module.exports = {
  handleTracingMiddleware,
  getSerializableSpans,
};
