using Microsoft.EntityFrameworkCore;
using UniMeet.DataContext.Context;

var builder = WebApplication.CreateBuilder(args);

// Kestrel konfiguráció nagy kérésekhez (base64 képek)
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 50 * 1024 * 1024; // 50 MB
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.MaxDepth = 64;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS konfiguráció a frontend számára
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "https://localhost:5173", "http://localhost:5186")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Connection string - támogatja a környezeti változót és a default local értéket
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=localhost\\SQLEXPRESS;Database=UniMeetDb;Trusted_Connection=True;TrustServerCertificate=True;";

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(connectionString);
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// HTTPS redirect kikapcsolva development-ben, mert CORS problémát okoz
// app.UseHttpsRedirection();

// CORS middleware - FONTOS: UseAuthorization ELŐTT legyen!
app.UseCors();

app.UseAuthorization();
app.MapControllers();
app.Run();
