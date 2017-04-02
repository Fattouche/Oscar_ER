
@Entity
@Table(name="intramural_players")
public class IntramuralPlayer {	
	@ManyToOne(fetch=FetchType.EAGER)
	private Employee employee;
}