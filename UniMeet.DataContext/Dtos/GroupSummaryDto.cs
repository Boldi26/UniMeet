using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace UniMeet.DataContext.Dtos
{
    public class GroupSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public int MembersCount { get; set; }
        public bool IsMember { get; set; }
        public bool IsPrivate { get; set; }
        public int CreatorUserId { get; set; }
        public bool IsOwner { get; set; } // True ha a user a csoport tulajdonosa vagy admin
        public bool HasPendingRequest { get; set; } // Van-e függőben lévő csatlakozási kérelme
        public int PendingRequestsCount { get; set; } // Tulajdonosnak: hány kérelem vár jóváhagyásra
    }
}
