using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using cloud_vision_api.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Google.Cloud.Vision.V1;

namespace cloud_vision_api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class VisionAPIController : ControllerBase
    {
        private readonly ILogger<VisionAPIController> _logger;
        private IConfiguration _configuration = null;
        private IOptions<ApiConfiguration> _apiConfig;
        public VisionAPIController(IOptions<ApiConfiguration> apiConfig, IConfiguration configuration, ILogger<VisionAPIController> logger)
        {
            _logger = logger;
            _configuration = configuration;
            _apiConfig = apiConfig;
        }

        [HttpGet("Test")]
        public object Test()
        {
            var config1 = _configuration.GetSection("ApiConfiguration");
            var c = new ApiConfiguration();
            var config2 = _configuration.GetValue<ApiConfiguration>("ApiConfiguration");
            var config3 = _configuration.GetValue<string>("ApiConfiguration:CloudVisionAPIKey");
            return new
            {
                a = _apiConfig,
                b = config2,
                c = config3
            };
        }
        [HttpPost("Recognize")]
        public object Recognize(CloudVisionRequest request)
        {
            var image = Image.FromUri(request.ImageUrl);
            var client = ImageAnnotatorClient.Create();
            var response = client.DetectText(image);

            return response;
            // foreach (var annotation in response)
            // {
            //     if (annotation.Description != null)
            //         Console.WriteLine(annotation.Description);
            // }
        }
    }
}
