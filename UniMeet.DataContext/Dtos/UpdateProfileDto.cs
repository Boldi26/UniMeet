using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace UniMeet.DataContext.Dtos
{
    public class UpdateProfileDto
    {
        public string? ProfileImageUrl { get; set; }
        public string? Faculty { get; set; }
        public string? Major { get; set; }
        public string? Bio { get; set; }
    }
}
