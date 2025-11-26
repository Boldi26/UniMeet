using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace UniMeet.DataContext.Dtos
{
    public class CreateGroupDto
    {
        public string Name { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public int CreatorUserId { get; set; }
        public bool IsPrivate { get; set; }
    }
}
