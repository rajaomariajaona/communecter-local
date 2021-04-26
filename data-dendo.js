const data = {
    name: "Competences",
    children: [{
            name: "Front-End",
            children: [
                { name: "Design", value: 2 },
                { name: "Ps", value: 1 },
                { name: "HTML", value: 2 },
                { name: "SVG", value: 3 },
                { name: "Bootstrap", value: 4 },
                {
                    name: "JavaScript World",
                    children: [
                        { name: "React", value: 2 },
                        { name: "Jquery", value: 1 },
                        { name: "D3.js", value: 4.5 },
                    ],
                },
            ],
        },
        {
            name: "Back-End",
            children: [
                { name: "PHP", value: 3 },
                { name: "C++", value: 1 },
                { name: "SQL", value: 2 },
                {
                    name: "Java World",
                    children: [
                        { name: "Java ", value: 1 },
                        { name: "JSP", value: 1 },
                        { name: "Hibernate", value: 2 },
                        { name: "Spring MVC", value: 3 },
                        { name: "Spring Data", value: 4 },
                        { name: "Spring Security", value: 2 },
                        { name: "Thymeleaf", value: 3 },
                    ],
                },
            ],
        },
    ],
};