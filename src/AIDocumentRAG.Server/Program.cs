namespace AIDocumentRAG.Server
{
    using AIDocumentRAG.Server.Models.Configuration;
    using AIDocumentRAG.Server.Services;

    using Microsoft.Extensions.DependencyInjection;
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
                    policy.WithOrigins("https://localhost:58585", "https://localhost:4200") // Specific origins
                          .AllowAnyMethod()
                          .AllowAnyHeader()
                          .AllowCredentials();
                });
            });

            // Configure File Management Options
            builder.Services.Configure<FileManagementOptions>(
                builder.Configuration.GetSection(FileManagementOptions.SectionName));

            // Register File Management Services
            builder.Services.AddScoped<IFileProcessor, FileProcessor>();
            builder.Services.AddScoped<IDirectoryCopier, DirectoryCopier>();
            builder.Services.AddScoped<FileManagementService>();

            // Register AI Services
            string openAiApiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY")
                ?? throw new InvalidOperationException("OPENAI_API_KEY environment variable is not set.");

            builder.Services.AddOpenAIChatCompletion("gpt-4o-mini", openAiApiKey);
            builder.Services.AddScoped<Kernel>();
            builder.Services.AddScoped<IAIChatService, AIChatService>();

            WebApplication app = builder.Build();

            app.UseDefaultFiles();
            app.MapStaticAssets();

            // Configure the HTTP request pipeline.
            // Remove UseHttpsRedirection for development to avoid redirect issues
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