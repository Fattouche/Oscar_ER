@Entity
@Table(name="project")
public class Project {
	@ManyToOne(fetch=FetchType.EAGER)
	private Employee employee;
}

