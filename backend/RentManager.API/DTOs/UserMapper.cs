using RentManager.API.Models;

namespace RentManager.API.DTOs
{
    public static class UserMapper
    {
        public static UserDto ToDto(User user)
        {
            var dto = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                Name = user.Name,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                LastLoginAt = user.LastLoginAt
            };

            // Map Person
            if (user.Person != null)
            {
                dto.Person = new PersonDto
                {
                    Id = user.Person.Id,
                    FirstName = user.Person.FirstName,
                    MiddleName = user.Person.MiddleName,
                    LastName = user.Person.LastName,
                    DateOfBirth = user.Person.DateOfBirth,
                    IdNumber = user.Person.IdNumber,
                    Nationality = user.Person.Nationality,
                    Occupation = user.Person.Occupation
                };
            }

            // Map Roles
            if (user.UserRoles != null && user.UserRoles.Any())
            {
                dto.Roles = user.UserRoles
                    .Select(ur => ur.Role.Name)
                    .ToList();

                dto.UserRoles = user.UserRoles
                    .Select(ur => new UserRoleDto
                    {
                        Role = new RoleDto
                        {
                            Id = ur.Role.Id,
                            Name = ur.Role.Name,
                            Description = ur.Role.Description
                        },
                        AssignedAt = ur.AssignedAt
                    })
                    .ToList();
            }

            return dto;
        }

        public static List<UserDto> ToDto(IEnumerable<User> users)
        {
            return users.Select(ToDto).ToList();
        }
    }
}
