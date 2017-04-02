

@Entity
@Table(name="teams")
public class Team {
	@OneToOne(fetch=FetchType.EAGER)
	private Project proj;
}

