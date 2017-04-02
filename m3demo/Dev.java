@Entity
@Table(name="dev_ops")
public class Dev {
	@OneToOne(fetch=FetchType.EAGER)
	private Project proj;
	
	@ManyToOne(fetch=FetchType.EAGER)
	private ProjectManager manager;
}

