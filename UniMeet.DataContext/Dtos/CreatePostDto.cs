using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace UniMeet.DataContext.Dtos
{
    public class CreatePostDto
    {
        public int UserId { get; set; }
        public string Content { get; set; } = string.Empty;
        public bool CommentsEnabled { get; set; } = true;
        public bool InterestEnabled { get; set; } = true;
    }
}
