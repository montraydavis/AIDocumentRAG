namespace AIDocumentRAG.Server
{
    using AIDocumentRAG.Server.Core.ChatInference;
    using AIDocumentRAG.Server.Core.FileManagement;
    using AIDocumentRAG.Server.Models.Configuration;
    using AIDocumentRAG.Server.Services.ChatInference;
    using AIDocumentRAG.Server.Services.FileManagement;

    using Microsoft.SemanticKernel;

    public class Program
    {
        public static void Main(string[] args)
        {
            WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

            // Add services to the container.
            builder.Services.AddControllers();

            // Add CORS services
            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(policy =>
                {
                    policy.WithOrigins("https://localhost:58585", "https://localhost:4200")
                          .AllowAnyMethod()
                          .AllowAnyHeader()
                          .AllowCredentials();
                });
            });

            // Configure File Management Options
            builder.Services.Configure<FileManagementOptions>(
                builder.Configuration.GetSection(FileManagementOptions.SectionName));

            // Register AI Services
            string openAiApiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY")
                ?? throw new InvalidOperationException("OPENAI_API_KEY environment variable is not set.");

            builder.Services.AddOpenAIChatCompletion("gpt-4o-mini", openAiApiKey, serviceId: "openai");
            builder.Services.AddOllamaChatCompletion("phi4", new Uri("http://localhost:11434"), serviceId: "ollama");
            builder.Services.AddScoped<Kernel>();
            builder.Services.AddScoped<IAIChatService, AIChatService>();

            // Register Document Summary Service as Singleton to persist cache
            builder.Services.AddSingleton<IDocumentSummaryService, DocumentSummaryService>();

            // Register File Management Services (updated order for DI)
            builder.Services.AddScoped<IFileProcessor, FileProcessor>();
            builder.Services.AddScoped<IDirectoryCopier, DirectoryCopier>();
            builder.Services.AddScoped<FileManagementService>();

            WebApplication app = builder.Build();

            app.UseDefaultFiles();
            app.MapStaticAssets();

            // Configure the HTTP request pipeline.
            if (!app.Environment.IsDevelopment())
            {
                app.UseHttpsRedirection();
            }

            // Enable CORS middleware
            app.UseCors();

            app.UseAuthorization();

            app.MapControllers();
            app.MapFallbackToFile("/index.html");

            app.Run();
        }
    }
}