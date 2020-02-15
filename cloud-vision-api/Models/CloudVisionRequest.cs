using System;
namespace cloud_vision_api.Models
{
    public class CloudVisionRequest
    {
        public string ImageUrl { get; set; }
        public byte[] Image { get; set; }
    }
}