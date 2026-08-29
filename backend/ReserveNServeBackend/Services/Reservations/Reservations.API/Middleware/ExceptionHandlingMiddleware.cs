using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Reservations.API.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }


    public async Task InvokeAsync(
        HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception)
        {
            await HandleExceptionAsync(
                context,
                exception);
        }
    }


    private async Task HandleExceptionAsync(
        HttpContext context,
        Exception exception)
    {
        var problem = exception switch
        {
            KeyNotFoundException => new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Resource not found",
                Detail = exception.Message
            },

            UnauthorizedAccessException => new ProblemDetails
            {
                Status = StatusCodes.Status403Forbidden,
                Title = "Access denied",
                Detail = exception.Message
            },

            ArgumentException => new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Invalid request",
                Detail = exception.Message
            },

            InvalidOperationException => new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Operation cannot be completed",
                Detail = exception.Message
            },

            HttpRequestException => new ProblemDetails
            {
                Status = StatusCodes.Status503ServiceUnavailable,
                Title = "External service unavailable",
                Detail =
                    "A required external service is currently unavailable."
            },

            TimeoutException => new ProblemDetails
            {
                Status = StatusCodes.Status504GatewayTimeout,
                Title = "External service timeout",
                Detail =
                    "A required external service did not respond in time."
            },

            _ => new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "Unexpected server error",
                Detail =
                    "An unexpected error occurred."
            }
        };

        problem.Instance =
            context.Request.Path;

        problem.Extensions["traceId"] =
            context.TraceIdentifier;

        if (problem.Status >= 500)
        {
            _logger.LogError(
                exception,
                "Unhandled exception while processing {Method} {Path}",
                context.Request.Method,
                context.Request.Path);
        }
        else
        {
            _logger.LogWarning(
                exception,
                "Request failed with status {StatusCode}: {Method} {Path}",
                problem.Status,
                context.Request.Method,
                context.Request.Path);
        }

        context.Response.StatusCode =
            problem.Status ??
            StatusCodes.Status500InternalServerError;

        context.Response.ContentType =
            "application/problem+json";

        await context.Response.WriteAsJsonAsync(
            problem);
    }
}